
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(
  "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"
);

const adminEmail = "mikefrencele@gmail.com";
const adminPassword = "Admin&&&:)))";


const sendMail = (toEmail, sub, htmlContent) => {
  const msg = {
    to: toEmail,
    from: adminEmail, // Use the email address or domain you verified above
    subject: "Verify your account ",
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
