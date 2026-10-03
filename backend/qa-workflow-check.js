require('dotenv').config({ path: '.env' });
const base = 'http://localhost:5000';

async function api(method, path, token, body) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

(async () => {
  try {
    const customerEmail = 'qa.customer.' + Date.now() + '@example.com';
    const techEmail = 'qa.tech.' + Date.now() + '@example.com';
    const adminEmail = 'qa.admin.' + Date.now() + '@example.com';
    const customerPhone = '900' + String(Date.now()).slice(-7);
    const techPhone = '901' + String(Date.now() + 1).slice(-7);
    const adminPhone = '902' + String(Date.now() + 2).slice(-7);

    const customerSignup = await api('POST', '/api/auth/signup', null, {
      name: 'QA Customer',
      email: customerEmail,
      phone: customerPhone,
      password: 'QaCustomer123!'
    });
    console.log('customerSignupDebug=' + JSON.stringify({ status: customerSignup.status, data: customerSignup.data }));
    const customerLogin = await api('POST', '/api/auth/login', null, {
      email: customerEmail,
      password: 'QaCustomer123!'
    });
    console.log('customerLoginDebug=' + JSON.stringify({ status: customerLogin.status, data: customerLogin.data }));
    const customerToken = customerLogin.data.token;

    const techSignup = await api('POST', '/api/auth/signup', null, {
      name: 'QA Technician',
      email: techEmail,
      phone: techPhone,
      password: 'QaTechnician123!',
      role: 'technician',
      skills: ['ac_repair'],
      location: 'Madanapalle'
    });
    console.log('techSignupDebug=' + JSON.stringify({ status: techSignup.status, data: techSignup.data }));
    const techLogin = await api('POST', '/api/auth/login', null, {
      email: techEmail,
      password: 'QaTechnician123!'
    });
    console.log('techLoginDebug=' + JSON.stringify({ status: techLogin.status, data: techLogin.data }));
    const techToken = techLogin.data.token;

    const adminCreate = await api('POST', '/api/auth/create-admin', null, {
      name: 'QA Admin',
      email: adminEmail,
      phone: adminPhone,
      password: 'QaAdmin123!',
      secretKey: process.env.JWT_SECRET
    });
    console.log('adminCreateDebug=' + JSON.stringify({ status: adminCreate.status, data: adminCreate.data }));
    const adminLogin = await api('POST', '/api/auth/login', null, {
      email: adminEmail,
      password: 'QaAdmin123!'
    });
    console.log('adminLoginDebug=' + JSON.stringify({ status: adminLogin.status, data: adminLogin.data }));
    const adminToken = adminLogin.data.token;

    const bookingCreate = await api('POST', '/api/bookings', customerToken, {
      service: 'AC Repair',
      deviceType: 'AC',
      problemDescription: 'AC not cooling',
      location: 'Madanapalle',
      date: new Date().toISOString(),
      providerId: 'tech-qa-dispatch'
    });
    const bookingId = bookingCreate.data && bookingCreate.data.booking ? bookingCreate.data.booking._id : null;
    console.log('bookingCreate=' + JSON.stringify({ status: bookingCreate.status, bookingId, statusName: bookingCreate.data && bookingCreate.data.booking ? bookingCreate.data.booking.status : null }));

    const myBookings = await api('GET', '/api/bookings', customerToken);
    console.log('customerBookingsDebug=' + JSON.stringify({ status: myBookings.status, data: myBookings.data }));
    console.log('customerBookings=' + JSON.stringify({ status: myBookings.status, count: Array.isArray(myBookings.data) ? myBookings.data.length : 0, bookingPresent: Array.isArray(myBookings.data) && !!myBookings.data.find(b => b._id === bookingId) }));

    const techAccept = await api('PUT', '/api/bookings/' + bookingId + '/status', techToken, { status: 'accepted' });
    console.log('techAccept=' + JSON.stringify({ status: techAccept.status, bookingStatus: techAccept.data && techAccept.data.status ? techAccept.data.status : null }));

    const techWay = await api('PUT', '/api/bookings/' + bookingId + '/status', techToken, { status: 'on_the_way' });
    console.log('techWay=' + JSON.stringify({ status: techWay.status, bookingStatus: techWay.data && techWay.data.status ? techWay.data.status : null }));

    const techArrived = await api('PUT', '/api/bookings/' + bookingId + '/status', techToken, { status: 'arrived' });
    console.log('techArrived=' + JSON.stringify({ status: techArrived.status, bookingStatus: techArrived.data && techArrived.data.status ? techArrived.data.status : null }));

    const quote = await api('PUT', '/api/bookings/' + bookingId + '/quote', techToken, {
      serviceCharge: 1200,
      sparePartsCost: 300,
      transportCharge: 100,
      quoteReason: 'Compressor issue',
      detectedIssues: 'Low gas pressure'
    });
    console.log('submitQuote=' + JSON.stringify({ status: quote.status, finalQuote: quote.data && quote.data.finalQuote ? quote.data.finalQuote : null, statusName: quote.data && quote.data.status ? quote.data.status : null }));

    const approve = await api('PUT', '/api/bookings/' + bookingId + '/approve-quote', customerToken, { approved: true });
    console.log('approveQuote=' + JSON.stringify({ status: approve.status, bookingStatus: approve.data && approve.data.status ? approve.data.status : null, quoteApproved: approve.data && approve.data.quoteApproved !== undefined ? approve.data.quoteApproved : null }));

    const complete = await api('PUT', '/api/bookings/' + bookingId + '/status', techToken, { status: 'completed' });
    console.log('complete=' + JSON.stringify({ status: complete.status, bookingStatus: complete.data && complete.data.status ? complete.data.status : null, paymentStatus: complete.data && complete.data.paymentStatus ? complete.data.paymentStatus : null }));

    const userCashPayment = await api('PUT', '/api/bookings/' + bookingId + '/pay', customerToken, { paymentMethod: 'cash', amount: 1600 });
    console.log('userCashPayment=' + JSON.stringify({ status: userCashPayment.status, paymentStatus: userCashPayment.data && userCashPayment.data.paymentStatus ? userCashPayment.data.paymentStatus : null }));

    const cashConfirm = await api('POST', '/api/payments/cash/confirm', techToken, { bookingId, amount: 1600 });
    console.log('cashConfirmDebug=' + JSON.stringify({ status: cashConfirm.status, data: cashConfirm.data }));
    console.log('cashConfirm=' + JSON.stringify({ status: cashConfirm.status, paymentStatus: cashConfirm.data && cashConfirm.data.paymentStatus ? cashConfirm.data.paymentStatus : null, amount: cashConfirm.data && cashConfirm.data.cashAmount ? cashConfirm.data.cashAmount : null }));

    const invoiceGet = await api('GET', '/api/invoices/booking/' + bookingId, customerToken);
    console.log('invoiceGet=' + JSON.stringify({ status: invoiceGet.status, invoiceNumber: invoiceGet.data && invoiceGet.data.invoice ? invoiceGet.data.invoice.invoiceNumber : null, total: invoiceGet.data && invoiceGet.data.invoice ? invoiceGet.data.invoice.total : null }));

    const ticketCreate = await api('POST', '/api/support', customerToken, {
      category: 'Booking',
      subject: 'AC not cooling after service',
      message: 'My AC has not been resolved and I need support.'
    });
    const ticketId = ticketCreate.data && ticketCreate.data.ticket ? ticketCreate.data.ticket._id : null;
    console.log('ticketCreate=' + JSON.stringify({ status: ticketCreate.status, ticketId, ticketStatus: ticketCreate.data && ticketCreate.data.ticket ? ticketCreate.data.ticket.status : null }));

    const adminTickets = await api('GET', '/api/support/admin/tickets', adminToken);
    console.log('adminTickets=' + JSON.stringify({ status: adminTickets.status, count: Array.isArray(adminTickets.data) ? adminTickets.data.length : 0, hasTicket: Array.isArray(adminTickets.data) && !!adminTickets.data.find(t => t._id === ticketId) }));

    const updateTicket = await api('PUT', '/api/support/admin/tickets/' + ticketId, adminToken, {
      status: 'in_progress',
      adminNotes: 'Investigating with technician.'
    });
    console.log('updateTicket=' + JSON.stringify({ status: updateTicket.status, updatedStatus: updateTicket.data && updateTicket.data.ticket ? updateTicket.data.ticket.status : null }));

    const customerTickets = await api('GET', '/api/support/my-tickets', customerToken);
    console.log('customerTickets=' + JSON.stringify({ status: customerTickets.status, count: Array.isArray(customerTickets.data) ? customerTickets.data.length : 0, updatedStatus: Array.isArray(customerTickets.data) && customerTickets.data.find(t => t._id === ticketId) ? customerTickets.data.find(t => t._id === ticketId).status : null }));

    const unauthorizedTicketUpdate = await api('PUT', '/api/support/admin/tickets/' + ticketId, customerToken, { status: 'resolved' });
    console.log('unauthorizedTicketUpdate=' + JSON.stringify({ status: unauthorizedTicketUpdate.status, message: unauthorizedTicketUpdate.data && unauthorizedTicketUpdate.data.message ? unauthorizedTicketUpdate.data.message : null }));

    console.log('FLOW_SUMMARY=success');
  } catch (err) {
    console.error('SCRIPT_ERROR=' + (err && err.stack ? err.stack : err));
    process.exit(1);
  }
})();
