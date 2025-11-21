import os
import mysql.connector
import pandas as pd
from dotenv import load_dotenv
from datetime import datetime
from email.mime.text import MIMEText
from smtplib import SMTP

CONFIG_PATH = "D:/Warehouse/Test/config.env"


def load_config():
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


def send_alert(cfg, subject, msg):
    email = MIMEText(msg, "plain", "utf-8")
    email["Subject"] = subject
    email["From"] = cfg["SMTP_USERNAME"]
    email["To"] = cfg["EMAIL_RECEIVER"]

    try:
        with SMTP(cfg["SMTP_HOST"], cfg["SMTP_PORT"]) as server:
            server.starttls()
            server.login(cfg["SMTP_USERNAME"], cfg["SMTP_PASSWORD"])
            server.send_message(email)
    except:
        print("⚠ Không gửi được mail cảnh báo.")


def write_log(cfg, id_config, start_time, total, fail, status):
    conn = mysql.connector.connect(
        host=cfg["CONTROL_HOST"],
        user=cfg["CONTROL_USER"],
        password=cfg["CONTROL_PASSWORD"],
        database=cfg["CONTROL_DB"]
    )
    cur = conn.cursor()
    cur.execute("""
                INSERT INTO logs(id_config, start_time, end_time, quantity, quantity_fail, quantity_success, status)
                VALUES (%s, %s, NOW(), %s, %s, %s, %s)
                """, (id_config, start_time, total, fail, total - fail, status))
    conn.commit()
    cur.close()
    conn.close()


def main():
    # 1.Load config
    cfg = load_config()
    # 2.Ghi nhận thời gian bắt đầu
    start_time = datetime.now()

    try:
        # 3.Kết nối control db
        control_conn = mysql.connector.connect(
            host=cfg["CONTROL_HOST"],
            user=cfg["CONTROL_USER"],
            password=cfg["CONTROL_PASSWORD"],
            database=cfg["CONTROL_DB"]
        )
        ccur = control_conn.cursor(dictionary=True)
        ccur.execute("SELECT * FROM config LIMIT 1")
        conf = ccur.fetchone()
        id_config = conf["config_id"]

        # 4.Kết nối staging db và bắt đầu đọc dữ liệu
        stg_conn = mysql.connector.connect(
            host=conf["stg_host"],
            user=conf["stg_username"],
            password=conf["stg_password"],
            database=conf["stg_db"]
        )
        stg = stg_conn.cursor(dictionary=True)
        stg.execute("SELECT * FROM stg_weather_report")
        stg_data = stg.fetchall()
        df = pd.DataFrame(stg_data)

        # 5. Kết nối warehouse
        wh_conn = mysql.connector.connect(
            host=conf["warehouse_host"],
            user=conf["warehouse_username"],
            password=conf["warehouse_password"],
            database=conf["warehouse_db"]
        )
        wh = wh_conn.cursor(dictionary=True)

        # 6. Xóa dữ liệu cũ
        wh.execute("DELETE FROM fact_weather_report")
        wh_conn.commit()

        # 7.Đồng bộ Dimension
        # (Lặp-Kiểm tra-INSERT 'weather_type' mới vào 'dim_weather')
        wh.execute("SELECT weather_type FROM dim_weather")
        existing = {x["weather_type"] for x in wh.fetchall()}

        for w in df["weather_type"].unique():
            if w not in existing:
                wh.execute("INSERT INTO dim_weather(weather_type) VALUES(%s)", (w,))
        wh_conn.commit()

        total, fail = 0, 0
        # 8.Xử lý Fact
        # (Lặp df, INSERT vào 'fact_weather_report')
        # (có try/except nội bộ để đếm 'fail')
        for _, r in df.iterrows():
            total += 1
            try:
                wh.execute("""
                           INSERT INTO fact_weather_report(location_sk, weather_sk, actual_date_sk, forecast_date_sk,
                                                           created_at_sk,
                                                           temp, feels_like, humidity, wind_speed)
                           SELECT %s,
                                  dw.weather_sk,
                                  %s,
                                  %s,
                                  %s,
                                  %s,
                                  %s,
                                  %s,
                                  %s
                           FROM dim_weather dw
                           WHERE dw.weather_type = %s
                           """, (
                               r["location_sk"],
                               r["actual_date_sk"], r["forecast_date_sk"], r["created_at_sk"],
                               r["temp"], r["feels_like"], r["humidity"], r["wind_speed"],
                               r["weather_type"]  # dùng để join dim_weather
                           ))


            except:
                fail += 1

        wh_conn.commit()
        # 9. Ghi log
        write_log(cfg, id_config, start_time, total, fail, "MODULE 3 SUCCESS")

    except Exception as e:
        #Ghi log fail
        write_log(cfg, id_config, start_time, 0, 0, f"MODULE 3 FAIL: {str(e)}")
        #Gửi mail cảnh báo
        send_alert(cfg, "[ETL ERROR] Module 3 Failed", str(e))
        print("❌ Lỗi:", e)
        return

    print(f"✅ Module 3 hoàn thành. Tổng: {total}, lỗi: {fail}")


if __name__ == "__main__":
    main()
