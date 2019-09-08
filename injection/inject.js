// Get all the notes
const throttleDuration = 500; //0.5 second
let notes = document.querySelectorAll('[aria-multiline="true"]');
const inputField = notes[1];
const noteClasses = notes[1].classList; // note[1] is always the input note bar
// Get the uglified class name of the note's content
const noteContentClass = noteClasses[noteClasses.length - 1];
// inputField.setAttribute("encryptorinjected", "true");
// Get current font color 
const color = getComputedStyle(notes[1]).color;
console.log(noteContentClass, color);

// create dom elements
const btnsOverlay = document.createElement("div");
btnsOverlay.classList.add("btn-overlay");

const lockBtn = document.createElement("div");
lockBtn.name = "crypt_btn";
lockBtn.classList.add("cryptor-btn");
btnsOverlay.appendChild(lockBtn);

const lockBtnCallbacks = [showPasswordCallBack, encryptNoteCallback, decryptNoteCallback, createEncryptedNoteCallback];

const lockedHtml = `<svg focusable="false" data-icon="lock" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path class="icon" fill="white" d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"></path></svg>`
const unlockedHtml = `<svg focusable="false" data-icon="unlock" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path class="icon" fill="currentColor" d="M400 256H152V152.9c0-39.6 31.7-72.5 71.3-72.9 40-.4 72.7 32.1 72.7 72v16c0 13.3 10.7 24 24 24h32c13.3 0 24-10.7 24-24v-16C376 68 307.5-.3 223.5 0 139.5.3 72 69.5 72 153.5V256H48c-26.5 0-48 21.5-48 48v160c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48z"></path></svg>`;

let password;

const pwInput = document.createElement("input");
pwInput.type = "password";
pwInput.setAttribute("contenteditable", "true");
pwInput.setAttribute("role", "textbox");
pwInput.setAttribute("aria-multiline", "false");
pwInput.classList.add("password");
pwInput.addEventListener("click", fixCallback);

let noteOverlay = document.createElement("div");
noteOverlay.classList.add("note-overlay");
noteOverlay.style.borderColor = color;

let cipherText, plainText, openedNote, isNoteEncrypted;
let pinButtonClasses;
let isDecryptSuccess = false;

showBtnsOverlay(notes[1]);

function verifyEncryptJson(note) {
    // Pre-selection
    if (!note.includes("{\"iv\":"))
        return false;

    try {
        const encrypJson = JSON.parse(note);
        if (encrypJson.hasOwnProperty("iv")) {
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

function getOpenedNote() {
    const editableNotes = document.getElementsByClassName(noteContentClass);
    Array.from(editableNotes)
        .filter(el => el.innerHTML != '')
        .filter(el => el.getAttribute('contenteditable') == "true")
        .forEach(el => {
            handleOpenedNote(el);
            return;
        });
    // No popup note found.
    if (btnsOverlay.contains(pwInput)){
        btnsOverlay.removeChild(pwInput);
        pwInput.value = "";
        password = "";
    }
}

function handleOpenedNote(el) {
    console.log("handle Opened note");
    openedNote = el;
    let text = el.innerHTML.replace(/<br>/g, "");

    showBtnsOverlay(el);

    if (verifyEncryptJson(text)) {
        // The note is an encrypted one
        showLockIcon();
        setLockBtnCallback(showPasswordCallBack);
        cipherText = text;
        isNoteEncrypted = true;
    } else {
        // The note is a plain text one
        showUnlockIcon();
        setLockBtnCallback(createEncryptedNoteCallback);
        plainText = el.innerHTML;
        isNoteEncrypted = false;
    }
}

function showNoteOverlay(text) {
    // Decrypt succeed
    openedNote.classList.forEach(cls => {
        noteOverlay.classList.add(cls);
    });
    openedNote.style.display = "none";
    openedNote.parentElement.insertBefore(noteOverlay, openedNote);
    noteOverlay.innerHTML = text;
    noteOverlay.setAttribute("contenteditable", "true");
    noteOverlay.setAttribute("role", "textbox");
    noteOverlay.setAttribute("aria-multiline", "true");
    noteOverlay.addEventListener("keydown", fixCallback);
    noteOverlay.addEventListener("keypress", fixCallback);
    noteOverlay.addEventListener("click", fixCallback);
    noteOverlay.addEventListener("input", event => {
        event.stopPropagation();
        lockBtn.click();
    });
}

function showBtnsOverlay(parentElement){
    // Add button overlay
    parentElement.parentElement.appendChild(btnsOverlay);

}

function decryptNote(text, password) {
    try {
        decryptText = sjcl.json.decrypt(password, text)
        isDecryptSuccess = true;
        return decryptText;
    } catch (e) {
        console.log(e);
    }
}

function encryptNote(password, text) {
    try{
        let test = sjcl.json.encrypt(password, text);
        return test;
    } catch (e) {
        console.log(e);
    }
}

function showLockIcon(){
    lockBtn.innerHTML = lockedHtml;
    const lockedIcon = lockBtn.getElementsByClassName("icon")[0];
    lockedIcon.style.fill = color;
}

function showUnlockIcon(){
    lockBtn.innerHTML = unlockedHtml;
    const lockedIcon = lockBtn.getElementsByClassName("icon")[0];
    lockedIcon.style.fill = color;
}

//------------------
// Lock button callbacks
function showPasswordCallBack(event) {
    console.log("showPasswordCallBack");
    event.stopPropagation();
    pwInput.innerText = "";
    if (!btnsOverlay.contains(pwInput)){
        btnsOverlay.insertBefore(pwInput, lockBtn);
        pwInput.addEventListener("keydown", event => {
            event.stopPropagation();
            if (event.key === "Enter")
                lockBtn.click();
        });
        // Now lock button will decrypt the note
        setLockBtnCallback(decryptNoteCallback);
    }
    pwInput.focus();
}

function createEncryptedNoteCallback(event) {
    console.log("createEncryptedNoteCallback");
    event.stopPropagation();
    
    showNoteOverlay(openedNote.innerHTML);
    // Show password field
    pwInput.innerText = "";
    if (!btnsOverlay.contains(pwInput)){
        btnsOverlay.insertBefore(pwInput, lockBtn);
        pwInput.addEventListener("keydown", event => {
            event.stopPropagation();
            if (event.key === "Enter")
                lockBtn.click();
        });
    }
    // Now lock button will encrypt the note
    setLockBtnCallback(encryptNoteCallback);

}

function decryptNoteCallback(event) {
    console.log("decryptNoteCallback");
    event.stopPropagation();
    password = pwInput.value;
    let text = decryptNote(cipherText, password);
    if (isDecryptSuccess) {
        showUnlockIcon();
        showNoteOverlay(text);
        setLockBtnCallback(encryptNoteCallback);
    }
}

function encryptNoteCallback(event) {
    console.log("encryptNoteCallback");
    event.stopPropagation();
    openedNote.innerHTML = encryptNote(pwInput.value, noteOverlay.innerHTML);
    openedNote.dispatchEvent(new Event("input")); 
}

function setLockBtnCallback(callback){
    lockBtnCallbacks.forEach(cb => {
        lockBtn.removeEventListener("click", cb);
    });
    lockBtn.addEventListener("click", callback);
}

//-----------
// Monitoring
// Callback function to execute when mutations are observed
const config = {
    childList: true,
    subtree: true
};
const callback = function (mutationsList, observer) {
    // Throttle the event to reduce the callback frequency.
    if (mutationsList.length > 10) { // won't observe small changes
        observer.disconnect();
        setTimeout(_ => {
            if (mutationsList[0].type === 'childList') {
                console.log('child node changed');
                getOpenedNote();
                observer.observe(document, config);
            }
        }, throttleDuration)

    }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);
// Start observing the target node for configured mutations
observer.observe(document, config);

function fixCallback(event) {
    event.stopPropagation();
}