const mysql = require('mysql2');
const cTable = require('console.table');

//Template class for creating a connection to the given database. This template contains get functions, add functions, and update functions
//to do the hard work of selecting data from related tables in the database. 
class Database {
	constructor(databaseName) {
		this._db = mysql.createConnection({
			host: 'localhost',
			user: 'root',
			password: 'Pasword',
			database: databaseName
		});
	}

	async getDepartments() {
		const results = await this._db.promise().execute('SELECT * FROM departments');
		return results[0];
	}

	async getRoles() {
		const results = await this._db.promise().execute(
			'SELECT employee_roles.id, employee_roles.title, departments.name, employee_roles.salary ' + 
			'FROM departments ' +
			'INNER JOIN employee_roles ' + 
			'ON departments.id=employee_roles.department_id'
		)
		return results[0];
	}

	//Confusing join stuff. Three joins were used to join the employees and managers table (just another employees table but aliased), the employee and employee roles table, and the employee and departments table.
	//Each join matches the corresponding foreign key with a primary key allowing for selection of the columns as shown in the SELECT statement.
	async getEmployees() {
		const results = await this._db.promise().execute(
			`SELECT employee.id, employee.first_name, employee.last_name, employee_roles.title, departments.name AS department, employee_roles.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager ` + 
			'FROM employees employee ' +
			'LEFT JOIN employees manager ' +
			'ON employee.manager_id=manager.id ' +
			'INNER JOIN employee_roles ' +
			'ON employee.role_id=employee_roles.id ' +
			'INNER JOIN departments ' +
			'ON employee_roles.department_id=departments.id'
		);
		return results[0];
	}

	//Get only managers by doing a RIGHT OUTER JOIN, then grouping to only show 1 instance of a manager. This can also be implemented by
	//using the getEmployees method and array methods to create an array of objects with the appropriate info about the manager.
	async getManagers() {
		const results = await this._db.promise().execute(
			`SELECT manager.id, CONCAT(manager.first_name, ' ', manager.last_name) AS manager ` +
			'FROM employees employee ' + 
			'RIGHT JOIN employees manager ' +
			'ON employee.manager_id=manager.id ' +
			'WHERE NOT employee.first_name IS NULL ' +
			'GROUP BY manager.id'
		);

		return results[0];

	}

	//Can be done similar to getEmployeesByDepartment
	async getEmployeesByManager(managerName) {

		const managers = await this.getManagers();

		const {id, manager} = managers.find(_manager => _manager.manager === managerName)

		const results = await this._db.promise().execute(
			`SELECT employee.first_name, employee.last_name, employee.manager_id ` +
			'FROM employees employee ' + 		
			'WHERE employee.manager_id=?', [id]
		);
		
		return results[0];
	}

	//Get employees by using a more basic function defined above. Can be done using joins, but this avoids that since we already have a way of getting that info through js
	async getEmployeesByDepartment(departmentName) {
		const employees = await this.getEmployees();
		const results = employees.filter(employee => employee.department === departmentName)
	
		return results;
	}

	async getDepartmentBudget(departmentName) {
		const employees = await this.getEmployeesByDepartment(departmentName);
		let totalBudget = 0;
		employees.forEach(employee => totalBudget += Number(employee.salary))
		return totalBudget;
	}
	async addDepartment(name) {
		const response = await this._db.promise().execute(
			`INSERT INTO departments (name) ` +
			`VALUES (?)`, [name]
		);
		return response[0];
	}
	
	async addRole(name, salary, department) {
		const response = await this._db.promise().execute(
			`INSERT INTO employee_roles (title, salary, department_id) ` +
			`VALUES (?, ?, ?)`, [name, salary, department]
		);
		return response[0];
	}

	async addEmployee(first, last, role_id, manager_id) {
		const response = await this._db.promise().execute(
			`INSERT INTO employees (first_name, last_name, role_id, manager_id) ` +
			`VALUES (?, ?, ?, ?)`, [first, last, role_id, manager_id]
		);
		return response[0];
	}

	async updateRole(role_id, employee_id) {
		const response = await this._db.promise().execute(
			`UPDATE employees SET role_id=? WHERE id=?`,
			[role_id, employee_id]
		)
		return response[0];
	}

	async updateEmployeeManager(manager_id, employee_id) {
		const response = await this._db.promise().execute(
			`UPDATE employees SET manager_id=? WHERE id=?`,
			[manager_id, employee_id]
		)
		return response[0];
	}
}

module.exports = Database;