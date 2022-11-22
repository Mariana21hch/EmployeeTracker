const inquirer = require('inquirer');
const mysql = require('mysql2');
const cTable = require('console.table');
const Database = require('./lib/database');

function printResponse(response) {
	return console.log(`\n${response.affectedRows} row(s) affected at id ${response.insertId}\n`)
}

async function prompt(questions) {
	const answers = await inquirer
		.prompt(questions)
	return answers;
}

async function updateEmployeeManager() {
	const managers = await db.getManagers();
	const employees = await db.getEmployees();

	const questions = [{
		type: 'list',
		name: 'employeeName',
		message: `Select the employee to update their manager`,
		choices: employees.map(employee => `${employee.first_name} ${employee.last_name}`)
	}, {
		type: 'list',
		name: 'managerName',
		message: `Select the employee's new manager`,
		choices: employees.map(employee => `${employee.first_name} ${employee.last_name}`)
	}];

	const {employeeName, managerName} = await prompt(questions);

	const employeeId = employees.find(employee => `${employee.first_name} ${employee.last_name}` === employeeName).id;
	const managerId = employees.find(manager => `${manager.first_name} ${manager.last_name}` === managerName).id;

	const response = await db.updateEmployeeManager(managerId, employeeId);

	printResponse(response);
	printResults(await db.getEmployees());
}

async function updateRole() {
	const employees = await db.getEmployees();
	const roles = await db.getRoles(); 

	const questions = [{
		type: 'list',
		name: 'employeeToUpdate',
		message: 'Select an employee to update',
		choices: employees.map((employee) => `${employee.first_name} ${employee.last_name}`)
	}, {
		type: 'list',
		name: 'employeeNewRole',
		message: `Select an employee's new role`,
		choices: roles.map((role) => role.title)
	}];

	const {employeeToUpdate, employeeNewRole} = await prompt(questions);
	
	const employeeId = employees.find((employee) => `${employee.first_name} ${employee.last_name}` === employeeToUpdate).id;
	
	const roleId = roles.find((role) => role.title === employeeNewRole).id;
	
	const response = await db.updateRole(roleId, employeeId);
	
	printResponse(response);
	printResults(await db.getEmployees());
}

async function addEmployee() {
	const roles = await db.getRoles();
	const managers = await db.getManagers();
	managers.push({manager: 'None'});

	const questions = [{
			type: 'input',
			name: 'employeeFirst',
			message: 'Employee first name: '
		}, {
			type: 'input',
			name: 'employeeLast',
			message: 'Employee last name: '
		}, {
			type: 'list',
			name: 'employeeRole',
			message: `Select the role for employee`,
			choices: roles.map(role => role.title)
		}, {
			type: 'list',
			name: 'employeeManager',
			message: `Select the employee's manager`,
			choices: managers.map(manager => manager.manager)
	}]

	const {employeeFirst, employeeLast, employeeRole, employeeManager} = await prompt(questions);
	
	const employeeRoleId = roles.find(({title}) => title === employeeRole).id;

	let employeeManagerId = null;
	if (employeeManager !== 'None') {
		employeeManagerId = managers.find(({manager}) => manager === employeeManager).id;
	} 

	const response = await db.addEmployee(employeeFirst, employeeLast, employeeRoleId, employeeManagerId);
	printResponse(response);
	printResults(await db.getEmployees());
}

async function addRole() {
	const departments = await db.getDepartments();

	const questions = [{
			type: 'input',
			name: 'roleName',
			message: 'Enter the name of the role'
		}, {
			type: 'input',
			name: 'roleSalary',
			message: 'Enter the salary for the role',
			validate: (roleSalary) => {
				return roleSalary >= 0 
				? true
				: 'Please enter a valid salary above or equal to 0'
			}
		},{	
			type: 'list',
			name: 'roleDepartment',
			message: 'Enter the department for the role',
			//Get the department names as an array
			choices: departments.map(department => department.name)
	}]	
	
	const {roleName, roleSalary, roleDepartment} = await prompt(questions);
	//Get the department id associated with the department
	const roleDepartmentId = departments.find((department) => department.name === roleDepartment).id;
	
	const response = await db.addRole(roleName, roleSalary, roleDepartmentId);
	printResponse(response);
	printResults(await db.getRoles());	
}

async function addDepartment() {
	const questions = [{
			type: 'input',
			name: 'departmentName',
			message: 'Enter the name of the department',
			validate: (departmentName) => {
				return departmentName.length > 4 
				? true 
				: `Please enter a valid department with more that 4 characters`
			}
	}];
	const {departmentName} = await prompt(questions);
	const response = await db.addDepartment(departmentName);
	printResponse(response);
	printResults(await db.getDepartments());
}

function printResults(results) {
	console.log('\n')
	console.table(results)
}

async function showDepartmentBudget() {
	const departments = await db.getDepartments();

	const questions = [{
		type: 'list',
		name: 'departmentName',
		message: 'Select a department to view their budget',
		choices: departments.map(department => department.name) 
	}]

	const {departmentName} = await prompt(questions);

	const totalBudget = await db.getDepartmentBudget(departmentName);
	printResults(await db.getEmployeesByDepartment(departmentName));
	printResults([{department: departmentName, "total budget": totalBudget}]);
}

//This function is a general way of displaying employees by either department or manager. Filter is general for department or manager
async function showEmployeesFiltered(filter, func) {
	//Call func which is either getManagers or getDepartments. Either should return an array to filters
	const filters = await func();

	const questions = [{
		type: 'list',
		name: filter,
		message: `Select a ${filter} to see their employees`,
		//create an array with each element as the department name or manager name
		choices: filters.map(_filter => {
			switch(filter) {
				case 'department':
					return _filter.name
				case 'manager':
					return _filter.manager
			}
		})
	}]

	const answers = await prompt(questions);

	//Depending on whether the user wants to filter on department or manager, call the appropriate function to get employees by whichever filter.
	switch(filter) {
		case 'department':
			const employeesByDepartment = await db.getEmployeesByDepartment(answers.department);
			printResults(employeesByDepartment);
			break;
		case 'manager':
			const employeesByManager = await db.getEmployeesByManager(answers.manager);
			printResults(employeesByManager);
			break;
	}
} 

async function showEmployees() {
	const results = await db.getEmployees();
	printResults(results);
}
async function showRoles() {
	const results = await db.getRoles();
	printResults(results);
}
async function showDepartments() {
	const results = await db.getDepartments();
	printResults(results);	
}

async function startPrompt() {
	const questions = [{
			type: 'list',
			name: 'startOption',
			message: 'Please choose one of the following options:',
			choices: [{name:'View all departments',
				   value: showDepartments},
				   {name: 'View all roles',
				    value: showRoles},
				   {name: 'View all employees',
				    value: showEmployees},
				   {name: 'View employees by manager',
				    value: () => showEmployeesFiltered('manager', () => db.getManagers())},
				   {name: 'View employees by department',
				    value: () => showEmployeesFiltered('department', () => db.getDepartments())},
				   {name: 'View total budget of a department',
				    value: showDepartmentBudget},
				   {name: 'Add a department',
				    value: addDepartment},
				   {name: 'Add a role',
				    value: addRole},
				   {name: 'Add an employee',
				    value: addEmployee},
				   {name: `Update an employee's role`,
				    value: updateRole},
				   {name: `Update an employee's manager`,
				    value: updateEmployeeManager}]
	}];

	//startOption is a function defined by the value in each object in the choices array of questions
	const {startOption} = await prompt(questions);
	//run the selected function (e.g. If I choose add a role, it runs addRole)
	await startOption();
	//recursively call the prompt until the user ctrl-c's
	startPrompt();
}

const db = new Database('employeesTrakerDB');
startPrompt();