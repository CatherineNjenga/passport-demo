'use strict';

const express = require('express');
const router =  express.Router();

const { homePage, signUp, userSignUp } =  require('../controllers/auth');

router.get('/', homePage);
router.route('/sign-up').get(signUp).post(userSignUp);

module.exports = router;