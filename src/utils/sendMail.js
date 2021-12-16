const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(
  "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"
);

const adminEmail = "mikefrencele@gmail.com";
const adminPassword = "Admin&&&:)))";

// const sendMail=(toEmail, sub, htmlContent)=>{
//     console.log("Eamil ", toEmail)
//     const transporter = nodemailer.createTransport({
//         host: 'smtp.gmail.com',
//         name:'smtp.gmail.com',
//         port: 587,
//         secure: false,
//         auth: {
//             user: adminEmail,
//             pass: adminPassword
//         },
//         tls: {
//             // do not fail on invalid certs
//             rejectUnauthorized: false
//         },
//         service:"Gmail"
//     });

//     const mailOptions = {
//         from: adminEmail,
//         to: toEmail,
//         subject: sub,
//         html: htmlContent
//     };
//     transporter.sendMail(mailOptions, function(error, info) {
//         if (error) {
//             console.log(error.message);
//         } else {
//             console.log('Email sent: ' + info.response);
//         }
//     });
// }

const sendMail = (toEmail, sub, htmlContent) => {
  const msg = {
    to: toEmail,
    from: adminEmail, // Use the email address or domain you verified above
    subject: "Sending with Twilio SendGrid is Fun",
    text: sub,
    html: htmlContent,
  };

  sgMail.send(msg).then(
    () => {},
    (error) => {
      console.error(error);

      if (error.response) {
        console.error(error.response.body);
      }
    }
  );
};
module.exports = sendMail;
