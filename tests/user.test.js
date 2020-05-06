const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const {
    userOneId,
    userOne,
    userTwo,
    taskOne,
    taskTwo,
    taskThree,
    setUpDatabase,
} = require('./fixtures/db')


beforeEach(setUpDatabase)

// SignUp: Creating
test('Should signup a new user', async () => {
    const response = await request(app).post('/users').send({
        name: "Daman Preet",
        email: "daman@testmail.com",
        password: "daman@123",
        age: 21
    }).expect(201)

    // Assert that the database was changed correctly
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // Assertion about the response
    expect(response.body).toMatchObject({
        user: {
            name: "Daman Preet",
            email: "daman@testmail.com",
            age: 21
        },
        token: user.tokens[0].token 
    })
    expect(user.password).not.toBe('daman@123')
})

// Login
test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    // Assert that token is successfully included in database
    const user = await User.findById(response.body.user._id)
    expect(user.tokens[1].token).toBe(response.body.token)
})

test('Shouldn\'t login non-existing user', async () => {
    await request(app).post('/users/login').send({
        email: 'random@testmail.com',
        password: 'random@123'
    }).expect(400)
})

// Request Profile
test('Should get the profile for authenticated user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Shouldn\'t get the profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

// Update Profile
test('Should update valid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Eva James'
        })
        .expect(200)

    // Assertion 
    const user = await User.findById(userOneId)
    expect(user.name).toBe('Eva James')
})

test('Shouldn\'t update invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Scranton'
        })
        .expect(400)
})

// Delete Profile
test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    
    // Assert that user deleted from database
    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('Shouldn\'t delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})

// Upload Avatat
test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar','tests/fixtures/profile-pic.jpg')
        .expect(200)

    // Assertion
    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})