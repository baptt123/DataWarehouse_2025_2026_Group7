import os
import csv
import requests
import mysql.connector
from email.mime.text import MIMEText
from smtplib import SMTP
from dotenv import load_dotenv
from datetime import datetime

CONFIG_PATH = "D:/Warehouse/config.env"

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
    except:
        print("[!] Gửi mail thất bại.")

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

def main():
    start_time = datetime.now()

    # 1) Load config
    cfg = load_config()
    if not cfg["CONTROL_HOST"]:
        send_alert("FL_1: Thiếu cấu hình", "Không load được config từ file .env", cfg)
        return

    # 2) Kết nối control-database
    try:
        conn_control = mysql.connector.connect(
            host=cfg["CONTROL_HOST"],
            user=cfg["CONTROL_USER"],
            password=cfg["CONTROL_PASSWORD"],
            database=cfg["CONTROL_DB"]
        )
    except Exception as e:
        send_alert("FL_1: Lỗi kết nối CONTROL DATABASE", str(e), cfg)
        write_log(cfg, None, start_time, 0, 0, f"FL_1")
        return

    cursor_control = conn_control.cursor(dictionary=True)
    cursor_control.execute("SELECT * FROM config LIMIT 1;")
    config_row = cursor_control.fetchone()

    if not config_row:
        send_alert("FL_1: Không tìm thấy cấu hình trong CONFIG", "Bảng config trống!", cfg)
        write_log(cfg, None, start_time, 0, 0, "FL_1")
        return

    id_config = config_row["config_id"]

    # 3) Load dữ liệu kết nối từ control-database stg_host, stg_username, stg_password, stg_db
    stg_host = config_row["stg_host"]
    stg_username = config_row["stg_username"]
    stg_password = config_row["stg_password"]
    stg_db = config_row["stg_db"]

    if  stg_host is None or stg_username is None or stg_password is None or stg_db is None:
        missing = [x for x in ["stg_host","stg_username","stg_password","stg_db"] if not config_row[x]]
        send_alert("FL_1: Thiếu cấu hình STAGING DATABASE", "\n".join(missing), cfg)
        write_log(cfg, id_config, start_time, 0, 0, f"FL_1")
        return

    cursor_control.close()
    conn_control.close()

    # 4) Kết nối đến staging-database
    try:
        conn_staging = mysql.connector.connect(
            host=stg_host,
            user=stg_username,
            password=stg_password,
            database=stg_db
        )
    except Exception as e:
        send_alert("FL_1: Lỗi kết nối STAGING DATABASE", str(e), cfg)
        write_log(cfg, id_config, start_time, 0, 0, f"FL_1")
        return

    cursor_staging = conn_staging.cursor(dictionary=True)
    cursor_staging.execute("SELECT location_id, city_convert FROM stg_location;")

    # 5) Lấy ra location từ staging-database
    locations = cursor_staging.fetchall()
    if not locations:
        send_alert("FL_1: Không có location trong stg_location", "Module dừng.", cfg)
        write_log(cfg, id_config, start_time, 0, 0, "FL_1")
        return

    # 6) Lấy ra base_url, api_key
    api_key = config_row["api_key"]
    base_url = config_row["base_url"]

    if not api_key or not base_url:
        send_alert("FL_1: Thiếu API KEY hoặc BASE_URL", f"api_key={api_key}, base_url={base_url}", cfg)
        write_log(cfg, id_config, start_time, 0, 0, "FL_1")
        return

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    OUTPUT_PATH = f"D:/Warehouse/weather_staging_{timestamp}.csv"
    os.makedirs("D:/Warehouse", exist_ok=True)

    total = 0
    fail = 0

    # 7) Tiến hành ghi dữ liệu và tải dữ liệu vào file csv
    try:
        with open(OUTPUT_PATH, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(["location_id", "city_name", "dt", "forecast_dt", "created_at", "temp", "feels_like", "humidity", "wind_speed", "weather_type"])

            for loc in locations:
                city = loc["city_convert"]
                url = f"{base_url}?q={city}&appid={api_key}&units=metric&lang=vi"

                try:
                    response = requests.get(url).json()
                    forecasts = response["list"]
                except Exception as e:
                    fail += 1
                    continue

                for item in forecasts:
                    total += 1
                    created_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    today = datetime.now().strftime("%Y-%m-%d")

                    writer.writerow([
                        loc["location_id"],
                        city,
                        today,
                        item["dt_txt"],
                        created_time,
                        item["main"]["temp"],
                        item["main"]["feels_like"],
                        item["main"]["humidity"],
                        item["wind"]["speed"],
                        item["weather"][0]["description"]
                    ])
    except Exception as e:
        send_alert("FL_1, FE_WS: Lỗi ghi file CSV tại MODULE 1", str(e), cfg)
        write_log(cfg, id_config, start_time, 0, 0, f"FL_1 - FE_WS")
        return


    cursor_staging.close()
    conn_staging.close()

    # 8) Tiến hành ghi log
    write_log(cfg, id_config, start_time, total, fail, "SC_1")


if __name__ == "__main__":
    main()
