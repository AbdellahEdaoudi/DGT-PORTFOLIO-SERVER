const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  pool: true, // Enable connection pooling
  maxConnections: 5, // Limit concurrent connections
  maxMessages: 100, // Limit messages per connection
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
<div style="direction: ltr; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e5e5e5; font-size: 14px;">

  <div style="text-align: center; padding: 10px 0; background: #fafafa; border-bottom: 1px solid #ededed;">
    <img src="https://res.cloudinary.com/dynprvsfg/image/upload/v1765243945/DGTplogo_1_fpek3w.png" alt="DGT Portfolio" style="max-width: 100px; height: auto;" />
  </div>

  <div style="padding: 15px 20px; text-align: center;">

    <h1 style="color: #0f0f0f; font-size: 20px; font-weight: 700; margin: 0 0 8px;">
      Quick! Your 24-Hour Access is Active 🚀
    </h1>

    <div style="width: 40px; height: 2px; background-color: #000; margin: 0 auto 12px; border-radius: 2px;"></div>

    <p style="color: #555; line-height: 1.5; margin: 0 0 12px;">
      Hi <strong>${username}</strong>,<br/>
      Your account is ready! You have <strong>24 hours</strong> of full premium access to build, customize, and launch your professional portfolio.
    </p>

    <div style="text-align: left; direction: ltr; display: inline-block; width: 100%; max-width: 420px; font-size: 13px; margin-bottom: 15px; background: #fff9f0; padding: 10px; border: 1px solid #ffeeba; border-radius: 6px;">
      <strong style="display: block; margin-bottom: 5px; color: #856404;">Don't wait! Today you can:</strong>
      <ul style="margin: 0; padding-left: 20px; text-align: left; line-height: 1.4; color: #856404;">
        <li style="margin-bottom: 4px;">✨ <strong>Choose any Premium Theme</strong></li>
        <li style="margin-bottom: 4px;">🔗 <strong>Claim your custom subdomain</strong></li>
        <li style="margin-bottom: 4px;">📱 <strong>Generate your unique QR Code</strong></li>
      </ul>
    </div>

    <div style="margin-bottom: 15px; direction: ltr;">
      <span style="font-size: 13px; font-weight: 600; color: #333;">Start now: </span>
      <a href="https://dgtportfolio.com/update-profile" style="font-size: 13px; color: #2563eb; text-decoration: underline;">https://dgtportfolio.com/update-profile</a>
    </div>

    <a href="https://dgtportfolio.com" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 10px 30px; border-radius: 6px; font-weight: 600; font-size: 14px;">
      Build My Portfolio Now
    </a>

    <p style="color: #7d7d7d; font-size: 11px; margin-top: 15px;">
      Time is ticking. Start impressing your clients today!
    </p>

  </div>

  <div style="background-color: #fafafa; padding: 8px; text-align: center; color: #8c8c8c; border-top: 1px solid #ededed; font-size: 11px;">
    &copy; ${new Date().getFullYear()} DGT Portfolio. All rights reserved.
  </div>

</div>
`;

const trialExpiredTemplate = (username) => `
<div style="direction: ltr; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e5e5e5; font-size: 14px;">

  <div style="text-align: center; padding: 10px 0; background: #fafafa; border-bottom: 1px solid #ededed;">
    <img src="https://res.cloudinary.com/dynprvsfg/image/upload/v1765243945/DGTplogo_1_fpek3w.png" alt="DGT Portfolio" style="max-width: 100px; height: auto;" />
  </div>

  <div style="padding: 15px 20px; text-align: center;">

    <h1 style="color: #0f0f0f; font-size: 20px; font-weight: 700; margin: 0 0 8px;">
      Time's Up! ⌛
    </h1>
    
    <div style="width: 40px; height: 2px; background-color: #000; margin: 0 auto 12px; border-radius: 2px;"></div>

    <p style="color: #555; line-height: 1.5; margin: 0 0 12px;">
      Hi <strong>${username}</strong>,<br/>
      Your 24-hour trial has ended. Your portfolio is currently <strong>locked</strong>, but don't worry—all your progress is safely saved and ready to go live!
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 0 auto 15px; max-width: 350px;">
        <p style="color: #475569; font-size: 13px; margin: 0;">
          Unlock your full professional portfolio and keep your custom link active for just <strong>$1/month</strong>.
        </p>
    </div>

    <div style="margin-bottom: 15px; direction: ltr;">
      <span style="font-size: 13px; font-weight: 600; color: #333;">Unlock Link: </span>
      <a href="https://dgtportfolio.com/subscription" style="font-size: 13px; color: #2563eb; text-decoration: underline;">https://dgtportfolio.com/subscription</a>
    </div>

    <a href="https://dgtportfolio.com/subscription" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 10px 30px; border-radius: 6px; font-weight: 600; font-size: 14px;">
      Keep My Portfolio Online
    </a>

    <p style="color: #7d7d7d; font-size: 12px; margin-top: 15px; margin-bottom: 0;">
      Don't let your professional image expire. One click keeps you live and reachable.
    </p>

  </div>

  <div style="background-color: #fafafa; padding: 8px; text-align: center; color: #8c8c8c; border-top: 1px solid #ededed; font-size: 11px;">
    &copy; ${new Date().getFullYear()} DGT Portfolio. All rights reserved.
  </div>

</div>
`;

module.exports = {
  sendEmail,
  welcomeTemplate,
  trialExpiredTemplate
};
