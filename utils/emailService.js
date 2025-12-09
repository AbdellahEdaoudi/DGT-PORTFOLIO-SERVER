const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "dgt.portfolio.ma@gmail.com",
        pass: "ppvk tunb tpir neht",
    },
});

const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: "dgt.portfolio.ma@gmail.com",
            to,
            subject,
            html: htmlContent,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const welcomeTemplate = (username) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e5e5e5; box-shadow: 0 8px 22px rgba(0,0,0,0.05);">

  <!-- Header -->
  <div style="text-align: center; padding: 15px 0; background: #fafafa; border-bottom: 1px solid #ededed;">
    <img src="https://res.cloudinary.com/dynprvsfg/image/upload/v1765243945/DGTplogo_1_fpek3w.png" alt="DGT Portfolio" style="max-width: 140px; height: auto;" />
  </div>

  <!-- Content -->
  <div style="padding: 25px 40px; text-align: center;">
    
    <h1 style="color: #0f0f0f; font-size: 28px; font-weight: 700; margin: 0 0 12px; letter-spacing: -0.5px;">
      Welcome to DGT Portfolio
    </h1>

    <div style="width: 90px; height: 3px; background-color: #000; margin: 14px auto 30px; border-radius: 2px;"></div>

    <p style="color: #555; font-size: 17px; line-height: 1.8; margin: 0 0 35px;">
      Hi <strong>${username}</strong>,<br/>
      We're thrilled to have you onboard! Your account is now active, and your 
      <strong>7-day free trial</strong> has officially started.
    </p>

    <!-- Button -->
    <a href="https://dgtportfolio.com" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 16px 48px; border-radius: 10px; font-weight: 600; font-size: 16px; letter-spacing: 0.6px; transition: background-color 0.3s;">
      Go to Dashboard
    </a>

    <p style="color: #7d7d7d; font-size: 14px; margin-top: 40px;">
      Start creating and sharing your personal portfolio today.
    </p>

  </div>

  <!-- Divider -->
  <div style="width: 100%; height: 1px; background-color: #ededed;"></div>

  <!-- Footer -->
  <div style="background-color: #fafafa; padding: 25px; text-align: center; color: #8c8c8c;">
    <p style="font-size: 13px; margin: 0 0 6px;">
      &copy; ${new Date().getFullYear()} DGT Portfolio
    </p>
    <p style="font-size: 12px; margin: 0;">
      All rights reserved.
    </p>
  </div>

</div>
`;

const trialExpiredTemplate = (username) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e5e5e5; box-shadow: 0 8px 22px rgba(0,0,0,0.05);">

  <!-- Header -->
  <div style="text-align: center; padding: 10px 0; background: #fafafa; border-bottom: 1px solid #ededed;">
    <img src="https://res.cloudinary.com/dynprvsfg/image/upload/v1765243945/DGTplogo_1_fpek3w.png" alt="DGT Portfolio" style="max-width: 140px; height: auto;" />
  </div>

  <!-- Content -->
  <div style="padding: 20px 40px; text-align: center;">
    
    <p style="color: #555; font-size: 17px; line-height: 1.8; margin: 0 0 25px;">
      Hi <strong>${username}</strong>,<br/>
      We hope you enjoyed your 7-day free trial. Your trial period has ended, but your journey doesn't have to stop here.
    </p>

    <!-- Promo Box -->
    <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 25px; border-radius: 10px; margin: 0 auto 35px; max-width: 450px;">
        <p style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px; font-weight: 600;">Exclusive Gift For You</p>
        <div style="font-family: monospace; font-size: 26px; color: #000; font-weight: 700; letter-spacing: 2px; margin-bottom: 8px;">
            G7A2Q1DK
        </div>
        <p style="color: #64748b; font-size: 14px; margin: 5px 0 0;">Use this promo code for a special discount!</p>
    </div>

    <!-- Button -->
    <a href="https://dgtportfolio.com/subscription" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 16px 48px; border-radius: 10px; font-weight: 600; font-size: 16px; letter-spacing: 0.6px; transition: background-color 0.3s;">
      Subscribe Now & Save
    </a>

    <p style="color: #7d7d7d; font-size: 14px; margin-top: 40px;">
      Unlock the full potential of your portfolio and keep impressing your audience.
    </p>

  </div>

  <!-- Divider -->
  <div style="width: 100%; height: 1px; background-color: #ededed;"></div>

  <!-- Footer -->
  <div style="background-color: #fafafa; padding: 25px; text-align: center; color: #8c8c8c;">
    <p style="font-size: 13px; margin: 0 0 6px;">
      &copy; ${new Date().getFullYear()} DGT Portfolio
    </p>
    <p style="font-size: 12px; margin: 0;">
      All rights reserved.
    </p>
  </div>

</div>
`;

module.exports = {
    sendEmail,
    welcomeTemplate,
    trialExpiredTemplate
};
