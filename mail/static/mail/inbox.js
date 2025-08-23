document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#submit-btn').addEventListener('click', send_email);
  document.querySelector('#emails-view').addEventListener('click', emailView);
 
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // By default, load the inbox
  load_mailbox('inbox');
});

function emailView(event) {
  event.preventDefault();
  const emailItem = event.target.closest('.email-item');
  let id = Number(emailItem.className.split(' ')[1].split('-')[1]);
  
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {    
    // console.log(email);
    // Show the email view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    let detailsDiv = document.querySelector('.email-details');

    // Clear previous details
    detailsDiv.innerHTML = '';
    detailsDiv.innerHTML = `
      <strong>From: </strong> ${email.sender} </br>
      <strong>To: </strong>  ${email.recipients}</br>
      <strong>Subject: </strong>  ${email.subject}</br>
      <strong>Timestamp: </strong>  ${email.timestamp}</br>
      <hr>
      <p>${email.body}</p>
    `;
    document.body.appendChild(emailView);

    // Mark the email as read
    if (!email.read) {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      });
    }
  });
}

// ----- Handle email submission -----
function send_email(event) {
  event.preventDefault();

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      load_mailbox('sent');
    }
  });
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  let detailsDiv = document.querySelector('.email-details');
  detailsDiv.innerHTML = ''; // Clear email details


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  let detailsDiv = document.querySelector('.email-details');
  detailsDiv.innerHTML = ''; // Clear email details

  // get all the mailbox emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    // Print emails
    emails.forEach(email => {
      console.log(email);
      let id = email.id;
      // console.log(id)
      // Create a div for each email
      const emailDiv = document.createElement('div');
      emailDiv.className = `email-item dataset-${id}`;
      emailDiv.innerHTML = `
        <span><strong>${email.sender}  </strong> ${email.subject}</span>  
        <br>
        <strong></strong> ${email.timestamp}
      `;
      // Append the email div to the emails view
      document.querySelector('#emails-view').appendChild(emailDiv);
    });
  }); 
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}

