-- Allow root to connect from any host in the Docker network
CREATE DATABASE IF NOT EXISTS dell_auto_serving;

GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'Rootmysql@123' WITH GRANT OPTION;
FLUSH PRIVILEGES;

