USE employeesTrakerDB;

INSERT INTO departments (name)
VALUES ("Sales"),
       ("Marketing"),
       ("Legal");

INSERT INTO employee_roles (title, salary, department_id)
VALUES  ("Sales Lead", 100000, 1),
        ("Manager Marketing", 150000, 2),
        ("Coordinator", 120000, 2),
        ("Accountant", 125000, 3),
        ("Legal Team Lead", 250000, 4);

INSERT INTO employees (first_name, last_name, role_id, manager_id)
VALUES  ("Jane", "Doe", 1, 3),
        ("Stitch", "Lilo", 2, 1),
        ("Nago", "Praia", 3, null),
        ("Soto", "Surg", 4, 3),
        ("Lea", "Michels", 5, null),
        ("Gary", "Lee", 2, null);
        ("Tommy", "Cammeron", 4, 7),
        ("Danny", "Heart", 1, 2);