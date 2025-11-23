from flask import Flask, jsonify
import mysql.connector # Thư viện kết nối MySQL

app = Flask(__name__)

# --- CẤU HÌNH KẾT NỐI DATABASE ---
def get_db_connection():
    connection = mysql.connector.connect(
        host="localhost",       # Địa chỉ server (thường là localhost)
        user="root",            # Tên đăng nhập DB của bạn
        password="",    # Mật khẩu DB của bạn
        database="datamart-database"   # Tên database chứa bảng dữ liệu
    )
    return connection

@app.route('/')
def home():
    return "Chào mừng đến với Flask API Weather!"

# --- ENDPOINT MỚI ĐỂ LẤY TEMP VÀ FEELS_LIKE ---
@app.route('/api/weather-temps', methods=['GET'])
def get_weather_temps():
    conn = None
    try:
        # 1. Mở kết nối
        conn = get_db_connection()

        # 2. Tạo con trỏ (cursor) để thực thi lệnh SQL
        # dictionary=True giúp kết quả trả về dạng {"cot": giatri} thay vì (giatri,)
        cursor = conn.cursor(dictionary=True)

        # 3. Viết câu lệnh SQL để lấy đúng 2 cột bạn cần
        # Thay 'ten_bang_cua_ban' bằng tên bảng thực tế trong ảnh (ví dụ: weather_data)
        query = "SELECT temp, feels_like FROM fact_weather_report LIMIT 10"

        cursor.execute(query)

        # 4. Lấy tất cả kết quả
        results = cursor.fetchall()

        # 5. Trả về JSON cho Client
        return jsonify({
            "status": "success",
            "count": len(results),
            "data": results
        })

    except mysql.connector.Error as err:
        # Xử lý nếu lỗi kết nối hoặc lỗi SQL
        return jsonify({"error": str(err)}), 500

    finally:
        # 6. Luôn luôn đóng kết nối và cursor để tránh tràn bộ nhớ
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    app.run(debug=True)