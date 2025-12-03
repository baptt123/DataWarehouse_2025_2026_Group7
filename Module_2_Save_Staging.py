import os
import pandas as pd
import mysql.connector
from dotenv import load_dotenv
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from smtplib import SMTP

CONFIG_PATH = "D:/Warehouse/config.env"
CSV_INPUT_PATH = "D:/Warehouse"

def load_config():
    print(">> Loading config:", CONFIG_PATH)
    load_dotenv(CONFIG_PATH)
    return {
        "CONTROL_HOST": os.getenv("CONTROL_HOST"),
        "CONTROL_USER": os.getenv("CONTROL_USER"),
        "CONTROL_PASSWORD": os.getenv("CONTROL_PASSWORD"),
        "CONTROL_DB": os.getenv("CONTROL_DB"),

        "SMTP_HOST": os.getenv("SMTP_HOST"),
        "SMTP_PORT": int(os.getenv("SMTP_PORT")),
        "SMTP_USERNAME": os.getenv("SMTP_USERNAME"),
        "SMTP_PASSWORD": os.getenv("SMTP_PASSWORD"),
        "EMAIL_RECEIVER": os.getenv("EMAIL_RECEIVER")
    }

def send_alert(subject, message, cfg):
    msg = MIMEText(message, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = cfg["SMTP_USERNAME"]
    msg["To"] = cfg["EMAIL_RECEIVER"]

    try:
        with SMTP(cfg["SMTP_HOST"], cfg["SMTP_PORT"]) as server:
            server.starttls()
            server.login(cfg["SMTP_USERNAME"], cfg["SMTP_PASSWORD"])
            server.send_message(msg)
    except:
        print("[!] Gửi mail thất bại.")

def write_log(cfg, id_config, start_time, quantity, quantity_fail, status):
    conn = mysql.connector.connect(
        host=cfg["CONTROL_HOST"],
        user=cfg["CONTROL_USER"],
        password=cfg["CONTROL_PASSWORD"],
        database=cfg["CONTROL_DB"]
    )
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO logs (id_config, start_time, end_time, quantity, quantity_fail, quantity_success, status)
        VALUES (%s, %s, NOW(), %s, %s, %s, %s)
    """, (
        id_config, start_time, quantity, quantity_fail,
        quantity - quantity_fail, status
    ))
    conn.commit()
    cursor.close()
    conn.close()

def main():
    start_time = datetime.now()

    # 1 Load config
    cfg = load_config()
    print("CONTROL_HOST =", cfg["CONTROL_HOST"])
    if not cfg["CONTROL_HOST"]:
        send_alert("FL_2: Thiếu cấu hình", "Không load được config từ file .env", cfg)
        write_log(cfg,None,start_time,0,0,"FL_2")
        return
    
    # 2) Connect CONTROL DB
    try:
        conn_control = mysql.connector.connect(
            host=cfg["CONTROL_HOST"],
            user=cfg["CONTROL_USER"],
            password=cfg["CONTROL_PASSWORD"],
            database=cfg["CONTROL_DB"]
        )
        cursor_control = conn_control.cursor(dictionary=True)
        cursor_control.execute("SELECT * FROM config LIMIT 1;")
        config = cursor_control.fetchone()
        id_config = config["config_id"]
        query_M2 = config["query_M2"]
        print(f"{query_M2}")

        # 3) Kết nối Staging
        stg_conn = mysql.connector.connect(
            host=config["stg_host"],
            user=config["stg_username"],
            password=config["stg_password"],
            database=config["stg_db"]
        )
        stg_cursor = stg_conn.cursor(dictionary=True)

        # 4) Xoá dữ liệu cũ
        stg_cursor.execute("DELETE FROM stg_weather_report")
        stg_conn.commit()

        # 5) CSV mới nhất
        files = [f for f in os.listdir(CSV_INPUT_PATH) if f.startswith("weather_staging_")]
        latest_csv = max(files, key=lambda x: os.path.getctime(os.path.join(CSV_INPUT_PATH, x)))
        df = pd.read_csv(os.path.join(CSV_INPUT_PATH, latest_csv))
        # -----------------------------
        # Chuyển các cột ngày tháng sang định dạng MySQL chuẩn 'YYYY-MM-DD'
        date_cols = ["dt", "forecast_dt", "created_at"]
        for col in date_cols:
            df[col] = pd.to_datetime(df[col], errors='coerce')  # convert sang datetime
            df[col] = df[col].dt.strftime('%Y-%m-%d')          # convert sang 'YYYY-MM-DD'
        # -----------------------------
        # 6) Load toàn bộ dữ liệu CSV vào bảng stg_raw_data
        insert_raw_sql = """
            INSERT INTO stg_raw_data (
                location_id, city_name, dt, forecast_dt, created_at,
                temp, feels_like, humidity, wind_speed, weather_type
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """
        total_raw, fails_raw = 0, 0
        for _, row in df.iterrows():
            total_raw += 1
            try:
                stg_cursor.execute(insert_raw_sql, (
                    row["location_id"],
                    row["city_name"],
                    row["dt"],
                    row["forecast_dt"],
                    row["created_at"],
                    row["temp"],
                    row["feels_like"],
                    row["humidity"],
                    row["wind_speed"],
                    row["weather_type"]
                ))
            except Exception as e:
                fails_raw += 1
                print(f"[!] Lỗi dòng {total_raw}: {e}")

        stg_conn.commit()
        print(f"✅ Đã nạp {total_raw - fails_raw}/{total_raw} dòng vào stg_raw_data.")

        # 7) Lấy dữ liệu từ stg_raw_data
                # 7) Transform dữ liệu từ stg_raw_data vào stg_weather_report
        print("🔄 Đang transform dữ liệu từ stg_raw_data sang stg_weather_report...")

        transform_sql = config["query_M2"]

        stg_cursor.execute(transform_sql)
        stg_conn.commit()

        # 8) Đếm số bản ghi sau transform
        stg_cursor.execute("SELECT COUNT(*) AS cnt FROM stg_weather_report;")
        count_result = stg_cursor.fetchone()
        total_trans = count_result["cnt"] if count_result else 0

        print(f"✅ Đã transform và load {total_trans} bản ghi vào stg_weather_report.")

        # 9) Ghi log thành công
        write_log(cfg, id_config, start_time, total_raw, fails_raw, "SC_2: MODULE 2 SUCCESS")

        # 10) Đóng kết nối
        cursor_control.close()
        conn_control.close()
        stg_cursor.close()
        stg_conn.close()
        
    except Exception as e:
        # 10) Ghi log thất bại
        write_log(cfg, id_config, start_time, 0, 0, f"FL_2: {str(e)}")
        send_alert("FL_2: Lỗi quá trình", f"Module 2 gặp lỗi:\n{str(e)}", cfg)
        print("❌ Lỗi:", e)
        return

    print(f"✅ Module 2 hoàn thành. Tổng: {total_raw}, Lỗi: {fails_raw}, Transform: {total_trans}")

if __name__ == "__main__":
    main()