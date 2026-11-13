# Thư mục lưu trữ ảnh tư liệu gia phả

Thư mục này được phân tách thành hai cấp bảo quản rõ ràng:

- `/public/tulieu/web/`: Chứa các bản ảnh đã giảm kích thước, tối ưu tốc độ tải trang để hiển thị trên website.
- `/public/tulieu/goc/`: Khu vực lưu giữ riêng bản ảnh chụp/scan chất lượng cao (TIFF/PNG/JPEG độ phân giải gốc), không tải trực tiếp lên giao diện web công cộng để đảm bảo hiệu năng và bảo vệ tài sản gốc của dòng họ.

## Lưu ý bắt buộc
- Không sử dụng ảnh giả hoặc ảnh do AI tạo ra để thay thế cho ảnh chụp tư liệu thật.
- Khi bổ sung tư liệu thực tế, đưa ảnh tối ưu vào `/public/tulieu/web/` và cập nhật đường dẫn tương ứng trong `giapha.json` kèm chú thích, nguồn ảnh và thông tin quyền sử dụng.
