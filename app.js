// updateBalance();
// showLogs();
let userName = '';

//login ------ 

function encrypt(text) {
    let arr = [];
    let res = '';
    for (i = 0; i < text.length; i += 1) {
        arr[i] = text.charCodeAt(i);
        res += arr[i].toString(16);
    }
    return res;
}

async function signIn() {
    document.getElementById('signInBtn').disabled = true;
    givenDetail = getInputData("signin-email", "signin-password");
    storedDetail = await getStoredData(givenDetail.Email);

    if (storedDetail.Email == "NONE" && storedDetail.Password == "NONE") {
        console.log("User not existing");
        alertFn("User does not exist. Please Signup", "alert-danger")
    } else if (storedDetail.Password != givenDetail.Password) {
        console.log("Wrong Password");
        alertFn("Wrong Password!", "alert-danger");
    } else {
        console.log("You are in!");
        userName = storedDetail.Email;
        let name = storedDetail.Name;
        alertFn(`Welcome ${name}`, "alert-success");
        showApp(userName, name);
    }
    document.getElementById('signInBtn').disabled = false;
}

async function signUp() {
    document.getElementById('signUpBtn').disabled = true;
    givenDetail = getInputData("signup-email", "signup-password");
    storedDetail = await getStoredData(givenDetail.Email);

    username = document.getElementById('signup-name').value;
    document.getElementById('signup-name').value = '';

    if (storedDetail.Email == "NONE") {
        await makeNewUser(givenDetail, username);
        // let userName = storedDetail.Email;
        // showApp(userName);
        showLogin();
    } else {
        console.log("User already exists")
        alertFn("User already exists", "alert-danger")
    }
    document.getElementById('signUpBtn').disabled = true;
}

function getInputData(email, pass) {
    givenEmail = document.getElementById(email).value;
    givenPass = document.getElementById(pass).value;
    encryptedGivenPass = encrypt(givenPass)
    document.getElementById(email).value = '';
    document.getElementById(pass).value = '';
    return { Email: givenEmail, Password: encryptedGivenPass };
}

function getStoredData(email) {
    exists = false;
    storeData = db.collection('LoginUser').where('Email', '==', email).limit(1).get().then((coll) => {
        coll.forEach((doc) => {
            if (doc.exists) {
                exists = true;
                dataEmail = doc.data().Email;
                dataPass = doc.data().Password;
                dataName = doc.data().Name;
            }
        });
        if (exists) {
            return { Email: dataEmail, Password: dataPass, Name: dataName };
        } else {
            return { Email: "NONE", Password: "NONE" };
        }
    });
    return storeData;
}

async function makeNewUser(givenDetails, username) {
    db.collection('LoginUser').doc().set({
        Email: givenDetails.Email,
        Name: username,
        Password: givenDetails.Password,
        CurrentId: 0,
        Balance: 0,
    });
}

// After loggin in -----------

function updateBalance(user) {
    db.collection("LoginUser").where('Email', '==', user).limit(1).get().then((coll) => {
        coll.forEach(doc => {
            balance = doc.data().Balance;
            document.getElementById('balance').innerHTML = balance;
        });
    });
}

function addBalance(sign) {
    db.collection("LoginUser").where('Email', '==', userName).limit(1).get().then((coll) => {
        coll.forEach((doc) => {
            let id = doc.id;

            db.collection("LoginUser").doc(id).get().then(doc => {
                balance = doc.data().Balance;
                currentId = parseInt(doc.data().CurrentId);

                newId = currentId + 1;
                value = document.getElementById('amount').value;

                if (value == '' || parseInt(value) <= 0 || ((sign == '-') && (balance < parseInt(value)))) {
                    alertFn("Please enter a valid amount", "alert-danger");
                } else {
                    amount = parseInt(value);
                    if (sign == '+') {
                        balance = balance + amount;
                    } else {
                        balance = balance - amount;
                    }

                    db.collection("LoginUser").doc(id).update({
                        CurrentId: newId,
                        Balance: balance,
                    });
                    // showLogs();
                    makeLog(newId, sign, amount, balance);
                    updateBalance(userName);
                }

                value = document.getElementById('amount').value = '';
            });
        });
    });
    updateBalance(userName);
    setTimeout(() => {
        console.log("Executed");
        updateBalance(userName)
    }, 2200);
}

function makeLog(transactionId, transaction, amount, balance) {
    if (transaction == '+') {
        transaction = "Add";
    } else {
        transaction = "Deduct";
    }
    let note = document.getElementById('note').value
    db.collection("LoginUser").where('Email', '==', userName).limit(1).get().then((coll) => {
        coll.forEach((doc) => {
            let id = doc.id;
            db.collection("LoginUser").doc(id).collection("Logs").doc().set({
                Id: transactionId,
                Transaction: transaction,
                Amount: amount,
                Balance: balance,
                Note: note,
                LogTime: generateTime(),
            });
        });
    });
    showLogs(userName);
}

function showLogs(user) {
    db.collection("LoginUser").where('Email', '==', user).limit(1).get().then((coll) => {
        coll.forEach((user) => {
            let id = user.id;

            db.collection("LoginUser").doc(id).collection("Logs").orderBy("Id", "desc").get().then((logs) => {
                logDoc = document.getElementById('logTable');
                logDoc.innerHTML =
                    `<tr style="background-color:black; color:white;">
            <th>S.No.</th>
            <th>Amount</th>
            <th>Note</th>
            <th>Transaction</th>
            <th>Time</th>
        </tr>`;
                logs.forEach((doc) => {
                    if (doc.data().Transaction == "Add") {
                        color = "#00800076";
                    } else {
                        color = "#ff000072";
                    }
                    logDoc.innerHTML +=
                        `<tr class="m-2 p-2" style="background-color:${color}; font-weight:bold;">
                    <td> ${doc.data().Id} </td>
                    <td>${doc.data().Amount}</td>
                    <td>${doc.data().Note}</td>
                    <td>${doc.data().Transaction}</td>
                    <td>${doc.data().LogTime}</td>
                </tr>`;
                });
            });
        });
    });

}

function alertFn(message, type) {
    document.getElementById('alertBox').classList.remove('hide');
    document.getElementById('alertBox').classList.add(type);
    document.getElementById('alertBox').innerHTML = message;

    setTimeout(function() {
        document.getElementById('alertBox').classList.add('hide');
        document.getElementById('alertBox').classList.remove(type);
        document.getElementById('alertBox').innerHTML = '';
    }, 3600);
}

function generateTime() {
    today = new Date();
    if (today.getHours() >= 12) {
        var hour = (today.getHours() - 12)
        var half = "PM";
    } else if (today.getHours() == 00) {
        var hour = 12
        var half = "AM";
    } else {
        var hour = today.getHours()
        var half = "AM";
    }

    if (today.getMinutes() < 10) {
        var min = "0" + today.getMinutes();
    } else {
        var min = today.getMinutes();
    }

    var time = hour + ":" + min + ':' + half;
    return time;
}

// website travel----- 

function showLogin() {
    document.getElementById('login').classList.remove('hide');
    document.getElementById('signup').classList.add('hide');
    document.getElementById('inner').classList.add('hide');
}

function showSignUp() {
    document.getElementById('signup').classList.remove('hide');
    document.getElementById('login').classList.add('hide');
    document.getElementById('inner').classList.add('hide');
}

function showApp(user, name) {
    document.getElementById('inner').classList.remove('hide');
    document.getElementById('login').classList.add('hide');
    document.getElementById('signup').classList.add('hide');

    userName = user;
    document.getElementById('user-name').innerHTML = name;
    document.title = name;
    updateBalance(userName);
    showLogs(userName);
}