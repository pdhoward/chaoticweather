
///////////////////////////////////////////////////////////////////////
/////////////////// configure chaoticbot nodemailer////////////////////
//////////////////////////////////////////////////////////////////////
var nodemailer =    require('nodemailer');

var transport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "chaoticbotshelp@gmail.com",
    pass: "chaoticbotsx1o"
  }
})

module.exports = transport;