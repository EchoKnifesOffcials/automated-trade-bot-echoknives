const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: ['https://echoknives.onrender.com', 'http://localhost:3000'], credentials: true }));
app.use(express.json());

// Store orders
const orders = new Map();

// API: Receive order from shop
app.post('/api/create-order', (req, res) => {
    const orderData = req.body;
    const orderId = orderData.orderId || 'ORD-' + Date.now();
    orders.set(orderId, { ...orderData, status: 'pending', createdAt: new Date().toISOString() });
    console.log(`📦 Order received: ${orderId}`);
    res.json({ success: true, orderId });
});

// API: Get order
app.get('/api/order/:orderId', (req, res) => {
    const order = orders.get(req.params.orderId);
    order ? res.json({ success: true, order }) : res.json({ success: false, error: 'Order not found' });
});

// API: Update order status
app.post('/api/update-order/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    const order = orders.get(orderId);
    if (order) {
        order.status = req.body.status || order.status;
        order.statusMessage = req.body.statusMessage || order.statusMessage;
        orders.set(orderId, order);
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// API: Add message to order chat
app.post('/api/order-message/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    const order = orders.get(orderId);
    if (order) {
        order.messages = order.messages || [];
        order.messages.push({ ...req.body, timestamp: new Date().toISOString() });
        orders.set(orderId, order);
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ========== PAYMENT PAGE ==========
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>ECHOKNIVES | Secure Checkout</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #0f0c29 100%);
            color: #fff;
            min-height: 100vh;
            padding: 40px 20px;
        }
        .animated-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -2; background: radial-gradient(circle at 20% 50%, #0f0c29 0%, #1a1a3e 50%, #0f0c29 100%); }
        .glow-orb { position: fixed; border-radius: 50%; filter: blur(80px); opacity: 0.3; z-index: -1; animation: float 25s infinite ease-in-out; }
        .orb-1 { width: 400px; height: 400px; background: #6c5ce7; top: -200px; left: -200px; }
        .orb-2 { width: 350px; height: 350px; background: #a855f7; bottom: -150px; right: -150px; animation-delay: 5s; }
        @keyframes float { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(30px, -30px); } }
        .particles { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; overflow: hidden; }
        .particle { position: absolute; background: rgba(108, 92, 231, 0.3); border-radius: 50%; animation: particleFloat 15s infinite linear; }
        @keyframes particleFloat { 0% { transform: translateY(100vh) translateX(0); opacity: 0; } 10% { opacity: 0.5; } 90% { opacity: 0.5; } 100% { transform: translateY(-100vh) translateX(50px); opacity: 0; } }
        
        .checkout-container { max-width: 1200px; margin: 0 auto; background: rgba(15, 12, 41, 0.85); backdrop-filter: blur(20px); border-radius: 40px; overflow: hidden; border: 1px solid rgba(108, 92, 231, 0.3); }
        .checkout-header { background: linear-gradient(135deg, #6c5ce7, #a855f7); padding: 25px 30px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
        .checkout-header h2 { font-family: 'Orbitron', monospace; font-size: 24px; font-weight: 800; }
        .security-badge { background: rgba(0,0,0,0.3); padding: 8px 16px; border-radius: 40px; font-size: 12px; }
        .checkout-two-col { display: flex; flex-wrap: wrap; }
        .checkout-left { flex: 1.2; padding: 30px; border-right: 1px solid rgba(108, 92, 231, 0.2); }
        .checkout-right { flex: 0.8; padding: 30px; background: rgba(0, 0, 0, 0.2); }
        .section-title { font-size: 18px; font-weight: 700; margin-bottom: 20px; color: #a855f7; font-family: 'Orbitron', monospace; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-size: 13px; color: #ccc; }
        .form-group input, .form-group select { width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.08); border: 1px solid rgba(108,92,231,0.3); border-radius: 30px; color: white; font-size: 14px; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #6c5ce7; background: rgba(108,92,231,0.1); }
        .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .payment-methods-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 10px; }
        .payment-option { background: rgba(255,255,255,0.05); border: 1px solid rgba(108,92,231,0.3); border-radius: 30px; padding: 12px; text-align: center; cursor: pointer; transition: all 0.3s ease; font-size: 14px; }
        .payment-option:hover, .payment-option.selected { background: #6c5ce7; border-color: #6c5ce7; transform: scale(1.02); }
        .tip-options { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
        .tip-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(108,92,231,0.3); padding: 8px 16px; border-radius: 30px; cursor: pointer; }
        .tip-btn:hover, .tip-btn.selected { background: #6c5ce7; }
        .promo-section { background: rgba(108,92,231,0.1); border-radius: 20px; padding: 15px; margin-top: 20px; }
        .promo-input-group { display: flex; gap: 10px; }
        .promo-input { flex: 1; padding: 12px; background: rgba(255,255,255,0.08); border: 1px solid rgba(108,92,231,0.3); border-radius: 30px; color: white; }
        .apply-promo { background: #6c5ce7; border: none; padding: 12px 20px; border-radius: 30px; color: white; cursor: pointer; }
        .order-items { margin-bottom: 20px; max-height: 300px; overflow-y: auto; }
        .order-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .order-total { padding-top: 15px; border-top: 2px solid #6c5ce7; }
        .order-total div { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .grand-total { font-size: 22px; font-weight: 800; color: #6c5ce7; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(108,92,231,0.3); }
        .roblox-info { background: rgba(108,92,231,0.15); border-radius: 20px; padding: 15px; margin-bottom: 20px; text-align: center; border: 1px solid rgba(108,92,231,0.3); }
        .btn-pay { width: 100%; padding: 16px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 60px; color: white; font-weight: 700; font-size: 16px; cursor: pointer; margin-top: 20px; transition: all 0.3s ease; }
        .btn-pay:hover { transform: scale(1.02); box-shadow: 0 10px 25px rgba(16,185,129,0.3); }
        .loading { text-align: center; padding: 60px; }
        .spinner { display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(108,92,231,0.3); border-top-color: #6c5ce7; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        /* Message Modal */
        .message-modal, .command-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.96); backdrop-filter: blur(20px); z-index: 10000; display: none; justify-content: center; align-items: center; }
        .message-modal.show, .command-modal.show { display: flex; }
        .message-container, .command-container { background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 30px; padding: 30px; max-width: 500px; width: 90%; text-align: center; border: 1px solid #6c5ce7; max-height: 80vh; overflow-y: auto; }
        .chat-messages { max-height: 300px; overflow-y: auto; margin: 15px 0; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 20px; }
        .message-buyer, .message-support { padding: 8px 12px; border-radius: 18px; margin: 8px 0; max-width: 85%; }
        .message-buyer { background: #2d2d44; align-self: flex-end; text-align: right; margin-left: auto; }
        .message-support { background: #1e1e3a; align-self: flex-start; border-left: 3px solid #6c5ce7; }
        .chat-input-area { display: flex; gap: 10px; margin-top: 15px; }
        .chat-input { flex: 1; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid #6c5ce7; border-radius: 30px; color: white; }
        .chat-send { background: #6c5ce7; border: none; padding: 12px 20px; border-radius: 30px; color: white; cursor: pointer; }
        
        /* Command GUI (Join Bot) */
        .command-avatar { width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 15px; overflow: hidden; border: 3px solid #6c5ce7; }
        .command-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .command-buttons { display: flex; gap: 15px; margin-top: 20px; }
        .cmd-btn { flex: 1; padding: 12px; border-radius: 60px; color: white; font-weight: 700; cursor: pointer; border: none; }
        .cmd-join { background: #8b5cf6; }
        .cmd-add { background: #ec4899; }
        .cmd-close { background: #3b82f6; }
        .age-notice { background: rgba(239,68,68,0.2); padding: 10px; border-radius: 15px; margin-top: 15px; font-size: 12px; color: #fca5a5; }
        
        @media (max-width: 768px) { .checkout-two-col { flex-direction: column; } .checkout-left { border-right: none; border-bottom: 1px solid rgba(108,92,231,0.2); } .row-2 { grid-template-columns: 1fr; } .payment-methods-grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>

<div class="animated-bg"></div>
<div class="glow-orb orb-1"></div>
<div class="glow-orb orb-2"></div>
<div class="particles" id="particles"></div>

<div class="checkout-container">
    <div class="checkout-header">
        <h2><i class="fas fa-lock"></i> Secure Checkout</h2>
        <div class="security-badge"><i class="fas fa-shield-alt"></i> 256-bit SSL Secure</div>
    </div>
    <div id="mainContent" class="loading"><div class="spinner"></div><p style="margin-top:20px;">Loading your order...</p></div>
</div>

<!-- Message Modal -->
<div id="messageModal" class="message-modal">
    <div class="message-container">
        <h3><i class="fas fa-comment-dots"></i> Customer Support</h3>
        <div id="chatMessages" class="chat-messages"></div>
        <div class="chat-input-area">
            <input type="text" id="chatInput" class="chat-input" placeholder="Type your message...">
            <button class="chat-send" onclick="sendMessage()"><i class="fas fa-paper-plane"></i></button>
        </div>
        <button class="btn-red" onclick="closeMessageModal()" style="margin-top:15px;">Close</button>
    </div>
</div>

<!-- Command GUI Modal (!JOINUS) -->
<div id="commandModal" class="command-modal">
    <div class="command-container">
        <div class="command-avatar"><img id="cmdAvatarImg" src="https://tr.rbxcdn.com/30d9e0ab1c9b2a8e3f4b5c6d7e8f9a0b/120/120/Image/Png"></div>
        <h3 id="cmdUsername">Sigmake5</h3>
        <p id="CmdDisplayName">sigmake5</p>
        <div class="command-buttons">
            <button class="cmd-btn cmd-join" onclick="joinBotServer()"><i class="fas fa-users"></i> Join Bot</button>
            <button class="cmd-btn cmd-add" onclick="addBotFriend()"><i class="fas fa-user-plus"></i> Add Bot</button>
            <button class="cmd-btn cmd-close" onclick="closeCommandModal()"><i class="fas fa-times"></i> Close</button>
        </div>
        <div class="age-notice"><i class="fas fa-exclamation-triangle"></i> If your account is under 13, you MUST add the bot and join the server after adding them back.</div>
    </div>
</div>

<script>
    const urlParams = new URLSearchParams(window.location.search);
    const cartParam = urlParams.get('cart');
    const robloxUser = urlParams.get('roblox');
    let orderId = urlParams.get('order_id');
    const returnUrl = urlParams.get('return') || 'https://echoknives.onrender.com';
    
    let orderItems = [], subtotal = 0;
    let currentOrderId = orderId;
    let chatInterval = null;
    
    if (cartParam) {
        try { orderItems = JSON.parse(decodeURIComponent(cartParam)); subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0); } catch(e) {}
    }
    if (orderItems.length === 0) {
        orderItems = [{ name: "Batwing", price: 152, quantity: 1 }, { name: "Icewing", price: 72, quantity: 2 }];
        subtotal = 296;
        currentOrderId = currentOrderId || "DEMO-" + Date.now();
    }
    
    let selectedPayment = "paypal", selectedTip = 0, promoDiscount = 0;
    
    function renderCheckout() {
        const itemsHtml = orderItems.map(item => `<div class="order-item"><span>${item.name} x${item.quantity}</span><span>₱${(item.price * item.quantity).toFixed(2)}</span></div>`).join('');
        const total = subtotal - promoDiscount + selectedTip;
        document.getElementById('mainContent').innerHTML = \`
            <div class="checkout-two-col">
                <div class="checkout-left">
                    <div class="section-title"><i class="fas fa-user"></i> Contact Information</div>
                    <div class="row-2"><div class="form-group"><label>First Name</label><input type="text" id="firstName" placeholder="John"></div><div class="form-group"><label>Last Name</label><input type="text" id="lastName" placeholder="Doe"></div></div>
                    <div class="row-2"><div class="form-group"><label>Email Address</label><input type="email" id="emailAddress" placeholder="your@email.com"></div><div class="form-group"><label>🎮 Roblox Username</label><input type="text" id="robloxUsername" value="${robloxUser || ''}" readonly style="background:rgba(108,92,231,0.2);"></div></div>
                    <div class="section-title" style="margin-top:24px;"><i class="fas fa-map-marker-alt"></i> Billing Address</div>
                    <div class="row-2"><div class="form-group"><label>Country</label><select id="country"><option value="PH">🇵🇭 Philippines</option><option value="US">🇺🇸 US</option><option value="GB">🇬🇧 UK</option></select></div><div class="form-group"><label>State</label><input type="text" id="state" placeholder="State"></div></div>
                    <div class="form-group"><label>Street Address</label><input type="text" id="address" placeholder="Street address"></div>
                    <div class="row-2"><div class="form-group"><label>ZIP Code</label><input type="text" id="zip" placeholder="ZIP"></div><div class="form-group"><label>City</label><input type="text" id="city" placeholder="City"></div></div>
                    <div class="section-title" style="margin-top:24px;"><i class="fas fa-credit-card"></i> Payment Method</div>
                    <div class="payment-methods-grid"><div class="payment-option selected" data-payment="paypal" onclick="selectPayment('paypal')"><i class="fab fa-paypal"></i> PayPal</div><div class="payment-option" data-payment="credit" onclick="selectPayment('credit')"><i class="fab fa-cc-visa"></i> Credit Card</div><div class="payment-option" data-payment="gcash" onclick="selectPayment('gcash')"><i class="fas fa-mobile-alt"></i> GCash</div></div>
                    <div class="section-title" style="margin-top:24px;"><i class="fas fa-gift"></i> Support the Team</div>
                    <div class="tip-options"><button class="tip-btn selected" data-tip="0" onclick="selectTip(0)">No tip</button><button class="tip-btn" data-tip="50" onclick="selectTip(50)">₱50</button><button class="tip-btn" data-tip="100" onclick="selectTip(100)">₱100</button><button class="tip-btn" data-tip="250" onclick="selectTip(250)">₱250</button><input type="number" id="customTip" placeholder="Custom" min="0" step="10" oninput="onCustomTip()" style="background:rgba(255,255,255,0.08); border:1px solid rgba(108,92,231,0.3); border-radius:30px; padding:8px 16px; width:100px; color:white;"></div>
                    <div class="section-title" style="margin-top:24px;"><i class="fas fa-ticket-alt"></i> Promo Code</div>
                    <div class="promo-section"><div class="promo-input-group"><input type="text" id="promoCodeInput" class="promo-input" placeholder="Enter promo code"><button class="apply-promo" onclick="applyPromoCode()">Apply</button></div><div id="promoMessage" style="font-size:12px; margin-top:10px;"></div></div>
                </div>
                <div class="checkout-right">
                    <div class="section-title"><i class="fas fa-shopping-cart"></i> Order Summary</div>
                    <div class="roblox-info"><i class="fab fa-roblox"></i> <strong>Delivering to:</strong> @${robloxUser || 'Not specified'}<div style="font-size:12px; margin-top:5px;">Order ID: ${currentOrderId || 'Pending'}</div></div>
                    <div class="order-items">${itemsHtml}</div>
                    <div class="order-total"><div><span>Subtotal:</span><span id="displaySubtotal">₱${subtotal.toFixed(2)}</span></div><div><span>Discount:</span><span id="displayDiscount">-₱${promoDiscount.toFixed(2)}</span></div><div><span>Tip:</span><span id="displayTip">₱${selectedTip.toFixed(2)}</span></div></div>
                    <div class="grand-total"><span>Total:</span><span id="displayTotal">₱${total.toFixed(2)}</span></div>
                    <button class="btn-pay" onclick="processOrder()"><i class="fas fa-lock"></i> Complete Payment</button>
                    <div class="terms" style="font-size:11px; text-align:center; margin-top:15px; color:#64748b;">By completing your purchase, you agree to our Terms of Service</div>
                </div>
            </div>
        \`;
    }
    
    function selectPayment(p) { selectedPayment = p; document.querySelectorAll('.payment-option').forEach(opt=>opt.classList.remove('selected')); document.querySelector(`.payment-option[data-payment="${p}"]`).classList.add('selected'); }
    function selectTip(a) { selectedTip = a; document.querySelectorAll('.tip-btn').forEach(btn=>btn.classList.remove('selected')); document.querySelector(`.tip-btn[data-tip="${a}"]`).classList.add('selected'); document.getElementById('customTip').value = ''; updateTotals(); }
    function onCustomTip() { selectedTip = parseInt(document.getElementById('customTip').value) || 0; document.querySelectorAll('.tip-btn').forEach(btn=>btn.classList.remove('selected')); updateTotals(); }
    function applyPromoCode() { const code = document.getElementById('promoCodeInput').value.trim().toUpperCase(); const msg = document.getElementById('promoMessage'); if (code === "STARTER26") { promoDiscount = 250; msg.innerHTML = '<span style="color:#10b981;">✅ Promo applied! -₱250</span>'; } else { promoDiscount = 0; msg.innerHTML = '<span style="color:#ef4444;">❌ Invalid code</span>'; } updateTotals(); }
    function updateTotals() { const total = subtotal - promoDiscount + selectedTip; document.getElementById('displaySubtotal').innerHTML = `₱${subtotal.toFixed(2)}`; document.getElementById('displayDiscount').innerHTML
