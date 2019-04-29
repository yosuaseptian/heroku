const sgMail = require('@sendgrid/mail')
const sgAPIkey = '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'

sgMail.setApiKey(sgAPIkey)


const sendVerify = (username, name, email) => {
    sgMail.send({
        to: email,
        from : 'aasd123@gmail.com',
        subject: "Test kirim email",
        html : `<h1><a href='http://localhost:2010/?verify?username=${username}'>Klik Untuk Verifikasi</a></h1>`
    })
}

module.exports = {
    sendVerify
}
