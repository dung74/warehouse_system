

-- 2. Thêm dữ liệu Roles (Vai trò)
INSERT INTO roles (name) VALUES 
('Admin'), 
('Manager'), 
('User');

-- 3. Thêm dữ liệu Warehouses (Kho hàng)
INSERT INTO warehouses (name, warehouse_type, parent_id, is_active) VALUES
('Kho Tổng Hà Nội', 'CENTRAL', NULL, true),
('Kho Chi nhánh Cầu Giấy', 'BRANCH', 1, true),
('Kho Chi nhánh Quận 1 - HCM', 'BRANCH', 1, true);

-- 4. Thêm dữ liệu Users (Tài khoản - Mật khẩu: 123456)
INSERT INTO users (username, email, full_name, is_active, password_hash, role_id, warehouse_id) VALUES
('admin', 'admin@example.com', 'Quản Trị Viên Hệ Thống', true, '$2b$12$K10ctME4xJrzB5EGWGV61e7nyH1o4INyR0lwuDHX5AIxbZZF4TtZC', 1, 1),
('user', 'user@example.com', 'Nhân Viên Kho Cầu Giấy', true, '$2b$12$K10ctME4xJrzB5EGWGV61e7nyH1o4INyR0lwuDHX5AIxbZZF4TtZC', 2, 2),
('manager_hcm', 'manager@example.com', 'Quản Lý Kho HCM', true, '$2b$12$K10ctME4xJrzB5EGWGV61e7nyH1o4INyR0lwuDHX5AIxbZZF4TtZC', 2, 3);

-- 5. Thêm dữ liệu Categories (Danh mục)
INSERT INTO categories (name) VALUES 
('Điện thoại di động'), 
('Máy tính xách tay'), 
('Máy tính bảng'), 
('Phụ kiện âm thanh'),
('Thiết bị đeo thông minh');

-- 6. Thêm dữ liệu Products (Sản phẩm)
INSERT INTO products (sku, name, category_id, base_price, attributes, description, image_path, created_at, is_active) VALUES
('IP15-PRM-256', 'iPhone 15 Pro Max 256GB', 1, 29500000.0, '{"color": "Titan Tự Nhiên", "ram": "8GB", "storage": "256GB"}'::jsonb, 'Flagship mới nhất của Apple', '/static/uploads/products/ip15prm.jpg', NOW(), true),
('IP14-PRM-128', 'iPhone 14 Pro Max 128GB', 1, 23000000.0, '{"color": "Tím", "ram": "6GB", "storage": "128GB"}'::jsonb, 'Mẫu iPhone cao cấp năm 2022', '/static/uploads/products/ip14prm.jpg', NOW(), true),
('SAM-S24-ULT', 'Samsung Galaxy S24 Ultra', 1, 27900000.0, '{"color": "Xám Titan", "ram": "12GB", "storage": "256GB"}'::jsonb, 'Điện thoại AI cao cấp từ Samsung', '/static/uploads/products/s24ul.jpg', NOW(), true),
('MAC-AIR-M2', 'MacBook Air M2 2022', 2, 24500000.0, '{"color": "Midnight", "ram": "8GB", "storage": "256GB"}'::jsonb, 'Laptop mỏng nhẹ chip Apple Silicon', '/static/uploads/products/macairm2.jpg', NOW(), true),
('MAC-PRO-M3', 'MacBook Pro 14 M3', 2, 38900000.0, '{"color": "Space Black", "ram": "16GB", "storage": "512GB"}'::jsonb, 'Laptop đồ họa chuyên nghiệp', '/static/uploads/products/macprom3.jpg', NOW(), true),
('DELL-XPS-15', 'Dell XPS 15 9530', 2, 42000000.0, '{"color": "Bạc", "ram": "16GB", "cpu": "Core i7"}'::jsonb, 'Laptop Windows viền siêu mỏng', '/static/uploads/products/xps15.jpg', NOW(), true),
('IPAD-PRO-11', 'iPad Pro 11 inch M2', 3, 21000000.0, '{"color": "Space Gray", "wifi": true, "storage": "128GB"}'::jsonb, 'Máy tính bảng mạnh nhất thế giới', '/static/uploads/products/ipadpro.jpg', NOW(), true),
('TAB-S9-PLUS', 'Samsung Galaxy Tab S9+', 3, 19500000.0, '{"color": "Đen", "wifi": true, "storage": "256GB"}'::jsonb, 'Tablet Android kèm bút S-Pen', '/static/uploads/products/tabs9.jpg', NOW(), true),
('APP-PODS-PRO2', 'AirPods Pro Gen 2', 4, 5500000.0, '{"color": "Trắng", "type": "In-ear", "anc": true}'::jsonb, 'Tai nghe chống ồn chủ động', '/static/uploads/products/airpodspro2.jpg', NOW(), true),
('APP-WTC-S9', 'Apple Watch Series 9', 5, 9500000.0, '{"color": "Starlight", "size": "41mm"}'::jsonb, 'Đồng hồ thông minh theo dõi sức khỏe', '/static/uploads/products/aw9.jpg', NOW(), true);

-- 7. Thêm dữ liệu Tồn kho (Stocks)
INSERT INTO stocks (product_id, warehouse_id, quantity) VALUES
(1, 1, 150), (1, 2, 50), (1, 3, 30),   
(2, 1, 80),  (2, 2, 20), (2, 3, 10),   
(3, 1, 100), (3, 2, 45), (3, 3, 25),   
(4, 1, 60),  (4, 2, 15), (4, 3, 20),   
(5, 1, 40),  (5, 2, 5),  (5, 3, 10),   
(9, 1, 200), (9, 2, 80), (9, 3, 50);   

-- 8. Thêm dữ liệu Giao dịch kho
INSERT INTO inventory_transactions (user_id, warehouse_id, code, transaction_type, status, cancellation_reason, created_at) VALUES
(1, 1, 'TX-IN-20231001-001', 'IN', 'APPROVED', NULL, NOW() - INTERVAL '5 days'),
(2, 2, 'TX-IN-20231005-002', 'IN', 'DRAFT', NULL, NOW() - INTERVAL '1 days'),
(3, 3, 'TX-IN-20231006-003', 'IN', 'CANCELED', 'Sai thông tin hóa đơn NCC', NOW());

-- 9. Chi tiết giao dịch
INSERT INTO transaction_details (transaction_id, product_id, quantity) VALUES
(1, 1, 150),
(1, 3, 100),
(1, 4, 60),
(2, 1, 50),
(2, 9, 80),
(3, 5, 20);

-- 10. Sổ kho
INSERT INTO inventory_ledgers (transaction_id, product_id, change_quantity, balance_quantity, created_at) VALUES
(1, 1, 150, 150, NOW() - INTERVAL '5 days'),
(1, 3, 100, 100, NOW() - INTERVAL '5 days'),
(1, 4, 60, 60, NOW() - INTERVAL '5 days');