document.addEventListener('DOMContentLoaded', function() {

  
  // Use buttons to toggle between views
  document.querySelector('#submit-btn').addEventListener('click', send_email);
  document.querySelector('#emails-view').addEventListener('click', emailView);
  document.querySelector('.search-input').addEventListener('keyup', searchEmail) 
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
    // Show the email view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    let detailsDiv = document.querySelector('.email-details');

    // Clear previous details
    detailsDiv.innerHTML = '';
    detailsDiv.innerHTML = `
    </hr>
      <strong>From: </strong> ${email.sender} </br>
      <strong>To: </strong>  ${email.recipients}</br>
      <strong>Subject: </strong>  ${email.subject}</br>
      <strong>Timestamp: </strong>  ${email.timestamp}</br>
      <button id="reply-btn" class="btn btn-sm btn-outline-primary">Reply</button>
      <hr>
      <p>${email.body}</p>
    `;
    
    const replyBtn = document.querySelector('#reply-btn');
    replyBtn.addEventListener('click', () => {
      compose_email();
      // Pre-fill composition fields    
      document.querySelector('#compose-recipients').value = email.sender;
      let subject = email.subject;
      if (!subject.startsWith('Re: ')) {
        subject = 'Re: ' + subject;
      }
      document.querySelector('#compose-subject').value = subject;
      document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
    }); 
    
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


function toggleArchive(emailId, isArchived) {
  fetch(`/emails/${emailId}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !isArchived
    })
  })
  .then(() => {
    load_mailbox('inbox'); // After archiving, reload inbox (or sent/archive depending on context)
  });
}

// search funcitonality
function searchEmail() {
  const query = this.value.toLowerCase();
  // loop through all emails in the UI
  document.querySelectorAll('.email-item').forEach(email => {
    const text = email.innerText.toLowerCase();
    if (text.includes(query)) {
      email.style.display = 'block';
    } else {
      email.style.display = 'none';
    }
  });
};

// delete email
function deleteEmail(emailId, emailDiv) {   
  // remove from UI
  emailDiv.remove();
  // delete from backend
  fetch(`/emails/delete/${emailId}`, {
    method: 'DELETE'
  })
  .then(() => {
    console.log(`Email with ID ${emailId} deleted.`);
  });
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
    // Print emails
    emails.forEach(email => {
      let id = email.id;
      const emailDiv = document.createElement('div');
      emailDiv.className = `email-item dataset-${id}`;
      // add color for read and unread emails
      emailDiv.style.backgroundColor = email.read ? '#e9ecef85' : '#ffffff';

      
      emailDiv.innerHTML = `
        <span><strong>${email.sender}  </strong> ${email.subject}</span>  
        <br>
        <span class="timestamp">${email.timestamp}</span>
        <br>
        <div class="item-icons">
          <i class="archive-btn archive-id-${id} fa-solid ${email.archived ? 'fa-box-archive' : 'fa-box-open'}" title="${email.archived ? 'Unarchive' : 'Archive'}"></i>
          <i class="delete-btn delete-id-${id} fa-solid fa-trash" title="delete"></i>
        </div> 
      `;
      // <i class="fa-solid fa-box-open"></i>
      if (mailbox === 'sent') {
        // Hide archive button for sent mailbox
        emailDiv.querySelector('.archive-btn').style.display = 'none';
      }

      // Append the email div to the emails view
      const archiveBtn = emailDiv.querySelector(`.archive-id-${id}`);
      const deleteBtn = emailDiv.querySelector(`.delete-id-${id}`);
      deleteBtn.addEventListener('click', (event) => {
        event.stopPropagation();   // prevent opening details
        deleteEmail(id, emailDiv);
      });
      
      archiveBtn.addEventListener('click', (event) => {
        event.stopPropagation();   // prevent opening details
        toggleArchive(id, email.archived);
      });
      document.querySelector('#emails-view').appendChild(emailDiv);
    });

  }); 
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}



