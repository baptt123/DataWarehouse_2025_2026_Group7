import os
import csv
import mysql.connector
from email.mime.text import MIMEText
from smtplib import SMTP
from dotenv import load_dotenv
from datetime import datetime

CONFIG_PATH = "D:/Warehouse/config.env"
WAREHOUSE_DIR = "D:/Warehouse"
FILE_PREFIX = "data_mart_"   # pattern file CSV

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
    except Exception as e:
        print("[!] Gửi mail thất bại.", e)

def write_log(cfg, id_config, start_time, quantity, quantity_fail, status):
    try:
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
            id_config,
            start_time,
            quantity,
            quantity_fail,
            quantity - quantity_fail,
            status
        ))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        send_alert("Lỗi ghi log", str(e), cfg)
        print("[!] Lỗi ghi log:", e)

def find_latest_datamart_file():
    files = [f for f in os.listdir(WAREHOUSE_DIR) if f.startswith(FILE_PREFIX) and f.endswith(".csv")]
    if not files:
        return None
    files.sort(reverse=True)
    return os.path.join(WAREHOUSE_DIR, files[0])

def main():
    start_time = datetime.now()

    # 1) Load config
    cfg = load_config()
    if not cfg["CONTROL_HOST"]:
        send_alert("Thiếu cấu hình", "Không load được config từ file .env", cfg)
        print('Thiếu config')
        return

    # 2) Kết nối CONTROL DB
    try:
        conn_control = mysql.connector.connect(
            host=cfg["CONTROL_HOST"],
            user=cfg["CONTROL_USER"],
            password=cfg["CONTROL_PASSWORD"],
            database=cfg["CONTROL_DB"]
        )
    except Exception as e:
        send_alert("Lỗi kết nối CONTROL DATABASE", str(e), cfg)
        print('2')
        write_log(cfg, None, start_time, 0, 0, "MODULE 5 FAIL: CONTROL CONNECTION")
        return

    cursor_control = conn_control.cursor(dictionary=True)
    cursor_control.execute("SELECT * FROM config LIMIT 1;")
    config_row = cursor_control.fetchone()

    if not config_row:
        send_alert("Không có config trong CONTROL DB", "Bảng config trống!", cfg)
        print('no config')
        write_log(cfg, None, start_time, 0, 0, "MODULE 5 FAIL: NO CONFIG RECORD")
        return

    id_config = config_row["config_id"]

    # 3) Lấy datamart config từ bảng
    dm_host = config_row["dm_host"]
    dm_username = config_row["dm_username"]
    dm_password = config_row["dm_password"]
    dm_db = config_row["dm_db"]

    missing = []
    for key, val in {
        "dm_host": dm_host,
        "dm_username": dm_username,
        "dm_password": dm_password,
        "dm_db": dm_db
    }.items():
        if val is None:
            missing.append(key)

    if missing:
        send_alert("Thiếu cấu hình DATAMART", "\n".join(missing), cfg)
        print('3')
        write_log(cfg, id_config, start_time, 0, 0, f"MODULE 5 FAIL: MISSING DM CONFIG ({', '.join(missing)})")
        return

    cursor_control.close()
    conn_control.close()

    # 4) Tìm file datamart mới nhất
    csv_path = find_latest_datamart_file()
    if not csv_path:
        send_alert("Không tìm thấy file datamart", "Không có file data_mart_*.csv trong D:/Warehouse", cfg)
        print('4')
        write_log(cfg, id_config, start_time, 0, 0, "MODULE 5 FAIL: NO FILE FOUND")
        return

    print("[INFO] Load file:", csv_path)

    # 5) Kết nối DATAMART DATABASE
    try:
        conn_dm = mysql.connector.connect(
            host=dm_host,
            user=dm_username,
            password=dm_password,
            database=dm_db
        )
    except Exception as e:
        send_alert("Lỗi kết nối DATAMART DATABASE", str(e), cfg)
        print('5')
        write_log(cfg, id_config, start_time, 0, 0, "MODULE 5 FAIL: DATAMART CONNECTION")
        return

    cursor_dm = conn_dm.cursor()

    total = 0
    fail = 0

    # 6) Load CSV vào datamart table
    try:
        with open(csv_path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)

            for row in reader:
                total += 1
                try:
                    cursor_dm.execute("""
                        INSERT INTO fact_weather_report
                        (city_name, weather_type, actual_date, forecast_date, created_at, temp, feels_like, humidity, wind_speed)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    """, (
                        row["city_name"],
                        row["weather_type"],
                        row["actual_date"],
                        row["forecast_date"],
                        row["created_at"],
                        row["temp"],
                        row["feels_like"],
                        row["humidity"],
                        row["wind_speed"]
                    ))
                except Exception:
                    fail += 1

        conn_dm.commit()

    except Exception as e:
        send_alert("Lỗi đọc/ghi CSV trong MODULE 5", str(e), cfg)
        print('6')
        write_log(cfg, id_config, start_time, 0, 0, "MODULE 5 FAIL: CSV ERROR")
        return

    cursor_dm.close()
    conn_dm.close()

    # 7) Ghi log thành công
    write_log(cfg, id_config, start_time, total, fail, "MODULE 5 SUCCESS")


if __name__ == "__main__":
    main()
