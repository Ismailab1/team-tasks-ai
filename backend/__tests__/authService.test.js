const authService = require('../services/authService');

describe('Authentication Service', () => {
	test('User can register', async () => {
		const user = { username: 'testuser', password: 'password123' };
		const result = await authService.register(user);
		expect(result).toHaveProperty('token');
	});

	test('User can login', async () => {
		const user = { username: 'testuser', password: 'password123' };
		const result = await authService.login(user);
		expect(result).toHaveProperty('token');
	});

	test('Token is valid', async () => {
		const token = 'validToken';
		const result = await authService.validateToken(token);
		expect(result).toBe(true);
	});

	test('Token is invalid', async () => {
		const token = 'invalidToken';
		const result = await authService.validateToken(token);
		expect(result).toBe(false);
	});
});