const jwt = require('jsonwebtoken');  
const User = require('../models/User');  

const auth = async (req, res, next) => {  
  try {  
    const token = req.header('Authorization').replace('Bearer ', '');  
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  
    const user = await User.findOne({ _id: decoded._id });  

    if (!user) {  
      throw new Error();  
    }  

    req.token = token;  
    req.user = user;  
    next();  
  } catch (e) {  
    res.status(401).send({ error: 'Please authenticate.' });  
  }  
};  

const authorize = (...roles) => {  
  return (req, res, next) => {  
    if (!roles.includes(req.user.role)) {  
      return res.status(403).json({  
        error: 'You do not have permission to perform this action'  
      });  
    }  
    next();  
  };  
};  

const generateToken = (user) => {  
  const payload = { _id: user._id, role: user.role }; // Customize the payload as needed  
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Customize expiration time as needed  
  return token;  
};  

module.exports = { auth, authorize, generateToken };