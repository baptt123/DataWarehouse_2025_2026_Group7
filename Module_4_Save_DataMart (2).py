import os
import pandas as pd
import mysql.connector
from datetime import datetime
from dotenv import load_dotenv
from email.mime.text import MIMEText
from smtplib import SMTP

CONFIG_PATH = "D:/Warehouse/config.env"

# Định nghĩa Mã Trạng Thái cho Module 4
STATUS_CODE = {
    "SUCCESS": "SC_4",
    "FAIL": "FL_4"
}

def load_config():
    # 2. Gọi hàm load_config()
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
    # 10. Gửi alert lỗi
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
        # 10.1.1. Ghi Log Lỗi không thành công (In ra console)
        print("[!] Gửi mail thất bại.")

def write_log(cfg, id_config, start_time, quantity, quantity_fail, status_code, status_detail):
    # status_code: SC_4 (Success) hoặc FL_4 (Fail)
    # status_detail: Thông tin chi tiết về trạng thái/lỗi
    # 10.1. Ghi Log Lỗi / 11. Ghi Log Thành công
    try:
        conn = mysql.connector.connect(
            host=cfg["CONTROL_HOST"],
            user=cfg["CONTROL_USER"],
            password=cfg["CONTROL_PASSWORD"],
            database=cfg["CONTROL_DB"]
        )
        cursor = conn.cursor()
        
        # Thêm status_code (SC_4/FL_4) vào cột status
        log_status = f"[{status_code}] {status_detail}"
        
        cursor.execute("""
            INSERT INTO logs (id_config, start_time, end_time, quantity, quantity_fail, quantity_success, status)
            VALUES (%s, %s, NOW(), %s, %s, %s, %s)
        """, (
            id_config,
            start_time,
            quantity,
            quantity_fail,
            quantity - quantity_fail,
            log_status # Dùng log_status mới
        ))
        conn.commit()
        cursor.close()
        conn.close()
        # 10.1.2. Ghi Log Lỗi thành công / 11.1. Ghi Log Thành công
    except Exception as e:
        # 10.1.1. Ghi Log Lỗi không thành công
        print("[!] Lỗi ghi log:", e)

def main():
    # 1. Start
    cfg = load_config()
    start_time = datetime.now()
    total = 0
    fail = 0
    
    # Lấy mã thất bại trực tiếp từ STATUS_CODE
    FAIL_CODE = STATUS_CODE["FAIL"]

    # 3) Kết nối CONTROL DB
    try:
        conn_control = mysql.connector.connect(
            host=cfg["CONTROL_HOST"],
            user=cfg["CONTROL_USER"],
            password=cfg["CONTROL_PASSWORD"],
            database=cfg["CONTROL_DB"]
        )
    except Exception as e:
        # 3. NO (Lỗi): Gửi Alert Lỗi và return
        # Ghi rõ Mã lỗi và lỗi chỗ send_alert
        send_alert(f"❌ [{FAIL_CODE}] Module_4 - Lỗi kết nối CONTROL DB", str(e), cfg)
        return
    
    # 4. Lấy thông tin config từ control-database
    cursor_control = conn_control.cursor(dictionary=True)
    cursor_control.execute("SELECT * FROM config LIMIT 1;")

    # 4.1. Đọc config_row và id_config từ control-database
    config_row = cursor_control.fetchone()
    id_config = config_row["config_id"]
    cursor_control.close()
    conn_control.close()

    # 5) Kết nối Warehouse
    try:
        wh_conn = mysql.connector.connect(
            host=config_row["warehouse_host"],
            user=config_row["warehouse_username"],
            password=config_row["warehouse_password"],
            database=config_row["warehouse_db"]
        )
    except Exception as e:
        # 5. NO (Lỗi): Gửi Alert Lỗi, Ghi Log Lỗi và return
        # Ghi rõ Mã lỗi và lỗi chỗ send_alert
        send_alert(f"❌ [{FAIL_CODE}] Module_4 - Lỗi kết nối WAREHOUSE", str(e), cfg)
        
        # Ghi Log Lỗi (Sử dụng mã FL_4)
        write_log(cfg, id_config, start_time, 0, 0, FAIL_CODE, f"Lỗi kết nối WH: {e}")
        return

    wh = wh_conn.cursor(dictionary=True)

    # 6) Truy vấn Data Mart (Bắt đầu khối try)
    try:
        # 6. YES (Thành công): Thực thi câu lệnh SQL
        wh.execute("""
            SELECT 
                dl.city_name,
                dw.weather_type,
                dd_actual.full_date AS actual_date,
                dd_forecast.full_date AS forecast_date,
                dd_created.full_date AS created_at,
                f.temp,
                f.feels_like,
                f.humidity,
                f.wind_speed
            FROM fact_weather_report f
            JOIN dim_location dl ON f.location_sk = dl.location_key
            JOIN dim_weather dw ON f.weather_sk = dw.weather_sk
            JOIN dim_date dd_actual ON f.actual_date_sk = dd_actual.date_sk
            JOIN dim_date dd_forecast ON f.forecast_date_sk = dd_forecast.date_sk
            JOIN dim_date dd_created ON f.created_at_sk = dd_created.date_sk
            ORDER BY dl.city_name ASC, dd_actual.full_date ASC
        """)
        data = wh.fetchall()
        total = len(data)
        
        # 7. Tạo DataFrame
        # 7.1. Chuyển kết quả truy vấn thành DataFrame của Pandas.
        df = pd.DataFrame(data)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"D:/Warehouse/data_mart_{timestamp}.csv"
        
        # 8. Lưu Data Mart
        # 8.1. Ghi DataFrame ra file CSV (data_mart_*.csv).
        df.to_csv(output_path, index=False, encoding="utf-8-sig")

    except Exception as e:
        # 6. NO (Lỗi - khối except): Gửi Alert Lỗi, Ghi Log Lỗi và return
        # 10. Gửi alert lỗi
        # Ghi rõ Mã lỗi và lỗi chỗ send_alert
        send_alert(f"❌ [{FAIL_CODE}] Module_4 - Lỗi tạo Data Mart", str(e), cfg)
        
        # 10.1. Ghi Log Lỗi (Sử dụng mã FL_4)
        write_log(cfg, id_config, start_time, total, total, FAIL_CODE, f"Lỗi truy vấn/lưu Data Mart: {e}")
        return

    wh.close()
    wh_conn.close()

    # 9. Success
    # 11. Ghi Log Thành công
    SUCCESS_CODE = STATUS_CODE["SUCCESS"]
    # 11.1. Gọi write_log() với trạng thái "MODULE 4 SUCCESS" (Sử dụng mã SC_4)
    write_log(cfg, id_config, start_time, total, fail, SUCCESS_CODE, "MODULE 4 SUCCESS")
    print(f"✅ Data Mart đã được tạo: {output_path}")

if __name__ == "__main__":
    main()