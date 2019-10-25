USE my_db;
DROP TABLE Meal;
CREATE TABLE Meal
(
id int primary key,
mdate varchar(63),
mmeal varchar(255),
mname varchar(255),
cal varchar(63)
);
SELECT * FROM Meal;