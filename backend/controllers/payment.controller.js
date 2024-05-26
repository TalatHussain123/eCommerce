import paypal from 'paypal-rest-sdk';
import stripe from "stripe";
const stripeKey = process.env.STRIPE_KEY; // not yet
const stripeClient = stripe(stripeKey);




// Configure PayPal SDK
paypal.configure({
    mode: 'sandbox', // Change to 'live' for production
    client_id: 'YOUR_CLIENT_ID',
    client_secret: 'YOUR_CLIENT_SECRET'
});

// Route to create PayPal payment
export const payment = (req, res) => {
    const { totalAmount } = req.body;

    const createPayment = {
        intent: 'sale',
        payer: {
            payment_method: 'paypal'
        },
        redirect_urls: {
            return_url: 'http://localhost:5000/payment-success', // Change for your actual URL
            cancel_url: 'http://localhost:5000/cancel-payment' // Change for your actual URL
        },
        transactions: [{
            amount: {
                total: totalAmount,
                currency: 'USD'
            }
        }]
    };

    paypal.payment.create(createPayment, (error, payment) => {
        if (error) {
            res.status(500).send({ error: 'Error creating PayPal payment' });
        } else {
            const approvalUrl = payment.links.find(link => link.rel === 'approval_url').href;
            res.send({ approvalUrl });
        }
    });
}

export const paymentHandler = (req, res) => {
    const { tokenId, amount } = req.body;
    stripeClient.charges.create(
        {
            source: tokenId,
            amount: amount,
            currency: "usd",
        },
        (stripeErr, stripeRes) => {
            if (stripeErr) {
                res.status(500).json(stripeErr);
            } else {
                res.status(200).json(stripeRes);
            }
        }
    );
};


// Route to execute PayPal payment
// app.get('/execute-payment', (req, res) => {
//     const { paymentId, PayerID } = req.query;

//     const executePayment = {
//         payer_id: PayerID
//     };

//     paypal.payment.execute(paymentId, executePayment, (error, payment) => {
//         if (error) {
//             res.redirect('/payment-failed'); // Redirect to a payment failed page
//         } else {
//             res.redirect('/payment-success'); // Redirect to a payment success page
//         }
//     });
// });