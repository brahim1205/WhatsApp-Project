const btnNouveau = document.getElementById("toggleBtn");
const btnMessages = document.getElementById("messagesBtn");
const btnGroupes = document.getElementById("groupesBtn");
const btnArchive = document.getElementById("archiveBtn");

const formulaire = document.getElementById("myForm");
const zoneContacts = document.getElementById("contactList");
const listeContacts = document.getElementById("contactUl");

const zoneGroupes = document.getElementById("groupContainer");
const listeGroupes = document.getElementById("groupList");
const btnNouveauGroupe = document.getElementById("showCreateGroup");
const formulaireGroupe = document.getElementById("createGroupForm");
const inputNomGroupe = document.getElementById("groupName");
const inputDescription = document.getElementById("groupDescription");
const casesContacts = document.getElementById("contactCheckboxes");

const zoneArchive = document.getElementById("archiveContainer");
const listeArchive = document.getElementById("archiveList");
const messageArchiveVide = document.getElementById("emptyArchive");

const contacts = [];
const groupes = [];
const contactsArchives = [];

btnMessages.addEventListener("click", () => {
  afficherSection("contacts");
});

btnNouveau.addEventListener("click", () => {
  afficherSection("nouveau");
});

btnGroupes.addEventListener("click", () => {
  afficherSection("groupes");
});

btnArchive.addEventListener("click", () => {
  afficherSection("archive");
});

function afficherSection(section) {

  formulaire.classList.add("hidden");
  zoneContacts.classList.add("hidden");
  zoneGroupes.classList.add("hidden");
  zoneArchive.classList.add("hidden");
  btnNouveauGroupe.classList.add("hidden");
  formulaireGroupe.classList.add("hidden");

  switch(section) {
    case "contacts":
      zoneContacts.classList.remove("hidden");
      break;
    case "nouveau":
      formulaire.classList.remove("hidden");
      break;
    case "groupes":
      zoneGroupes.classList.remove("hidden");
      listeGroupes.classList.remove("hidden");
      btnNouveauGroupe.classList.remove("hidden");
      afficherGroupes();
      break;
    case "archive":
      zoneArchive.classList.remove("hidden");
      afficherArchive();
      break;
  }
}

formulaire.addEventListener("submit", (e) => {
  e.preventDefault();

  let nom = document.getElementById("name").value.trim();
  const tel = document.getElementById("tel").value.trim();

  if (!nom || !tel) {
    alert("Remplissez tous les champs.");
    return;
  }

  const contactExistant = contacts.find((c) => c.tel === tel);

  if (contactExistant) {
    if (contactExistant.name === nom) {
      let compteur = 2;
      while (
        contacts.find((c) => c.name === nom + " " + compteur && c.tel === tel)
      ) {
        compteur++;
      }
      nom = nom + " " + compteur;
    } else {
      alert("Ce numéro est déjà utilisé.");
      return;
    }
  }

  contacts.push({ name: nom, tel });
  afficherContacts();
  formulaire.reset();
  afficherSection("contacts");
});

function afficherContacts() {
  listeContacts.innerHTML = '';
  const template = document.getElementById('contact-template');

  contacts.forEach((contact, index) => {
    const nomParts = contact.name.split(' ');
    const lettres = (nomParts[0][0] || '') + (nomParts[1]?.[0] || '');
    const clone = template.content.cloneNode(true);
    clone.querySelector('.profile-icon').textContent = lettres.toUpperCase();
    clone.querySelector('.contact-text').textContent = `${contact.name} - ${contact.tel}`;

    const li = clone.querySelector('li');
    li.dataset.index = index;

    const archiveBtn = clone.querySelector('.archive-btn');
    const deleteBtn = clone.querySelector('.delete-btn');
    const optionsToggle = clone.querySelector('.options-toggle');
    const optionsMenu = clone.querySelector('.options-menu');

    optionsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      
      document.querySelectorAll('#contactUl .options-menu').forEach(menu => {
        if (menu !== optionsMenu) {
          menu.classList.add('hidden');
        }
      });
      
      optionsMenu.classList.toggle('hidden');
    });

    archiveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(li.dataset.index);
      archiverContact(index);
      optionsMenu.classList.add('hidden');
    });

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(li.dataset.index);
      if (confirm(`Supprimer définitivement ${contacts[index].name} ?`)) {
        contacts.splice(index, 1);
        afficherContacts();
      }
      optionsMenu.classList.add('hidden');
    });

    listeContacts.appendChild(clone);
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('#contactUl .options-menu').forEach(menu => {
      menu.classList.add('hidden');
    });
  });
}

function archiverContact(index) {
  const contact = contacts[index];
  contactsArchives.push({
    name: contact.name,
    tel: contact.tel,
    dateArchivage: new Date().toLocaleDateString('fr-FR')
  });
  contacts.splice(index, 1);
  afficherContacts();
  alert(`${contact.name} a été archivé`);
}

function afficherArchive() {
  listeArchive.innerHTML = '';
  
  if (contactsArchives.length === 0) {
    messageArchiveVide.classList.remove('hidden');
    return;
  }
  
  messageArchiveVide.classList.add('hidden');
  const template = document.getElementById('archive-template');

  contactsArchives.forEach((contact, index) => {
    const nomParts = contact.name.split(' ');
    const lettres = (nomParts[0][0] || '') + (nomParts[1]?.[0] || '');
    const clone = template.content.cloneNode(true);
    clone.querySelector('.profile-icon').textContent = lettres.toUpperCase();
    clone.querySelector('.contact-text').textContent = `${contact.name} - ${contact.tel}`;

    const div = clone.querySelector('div');
    div.dataset.index = index;

    // Ajouter les événements avant d'ajouter au DOM
    const restoreBtn = clone.querySelector('.restore-btn');
    const deleteArchiveBtn = clone.querySelector('.delete-archive-btn');
    const optionsToggle = clone.querySelector('.options-toggle');
    const optionsMenu = clone.querySelector('.options-menu');

    optionsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      
      document.querySelectorAll('#archiveList .options-menu').forEach(menu => {
        if (menu !== optionsMenu) {
          menu.classList.add('hidden');
        }
      });
      
      optionsMenu.classList.toggle('hidden');
    });

    restoreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(div.dataset.index);
      restaurerContact(index);
      optionsMenu.classList.add('hidden');
    });

    deleteArchiveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(div.dataset.index);
      if (confirm(`Supprimer définitivement ${contactsArchives[index].name} ?`)) {
        contactsArchives.splice(index, 1);
        afficherArchive();
      }
      optionsMenu.classList.add('hidden');
    });

    listeArchive.appendChild(clone);
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('#archiveList .options-menu').forEach(menu => {
      menu.classList.add('hidden');
    });
  });
}

function restaurerContact(index) {
  const contact = contactsArchives[index];
  contacts.push({ name: contact.name, tel: contact.tel });
  contactsArchives.splice(index, 1);
  
  afficherSection("contacts");
  afficherContacts();
  
  alert(`${contact.name} a été restauré et ajouté à vos messages`);
}


btnNouveauGroupe.addEventListener("click", () => {
  if (contacts.length < 3) {
    alert("Il faut au moins 3 contacts pour créer un groupe.");
    return;
  }

  casesContacts.innerHTML = "";
  contacts.forEach((contact, i) => {
    casesContacts.innerHTML += `
      <div>
        <input type="checkbox" id="c-${i}" value="${contact.name}">
        <label for="c-${i}">${contact.name}</label>
      </div>
    `;
  });

  formulaireGroupe.classList.remove("hidden");
  listeGroupes.classList.add("hidden");
  btnNouveauGroupe.classList.add("hidden");
});

formulaireGroupe.addEventListener("submit", (e) => {
  e.preventDefault();

  const nom = inputNomGroupe.value.trim();
  const description = inputDescription.value.trim();
  const selection = casesContacts.querySelectorAll("input:checked");

  if (!nom) {
    alert("Nom obligatoire.");
    return;
  }

  if (selection.length < 3) {
    alert("Choisissez au moins 3 membres.");
    return;
  }

  const membres = Array.from(selection).map((el) => el.value);

  groupes.push({ nom, description, membres, admin: "Moi" });

  formulaireGroupe.reset();
  formulaireGroupe.classList.add("hidden");
  listeGroupes.classList.remove("hidden");
  btnNouveauGroupe.classList.remove("hidden");

  afficherGroupes();
});

function afficherGroupes() {
  listeGroupes.innerHTML = "";

  if (groupes.length === 0) {
    listeGroupes.textContent = "Aucun groupe pour le moment.";
    return;
  }

  groupes.forEach((groupe) => {
    const li = document.createElement("li");
    li.className = "p-2 bg-white rounded mb-2 shadow";

    li.innerHTML = `
      <h3 class="font-semibold text-gray-800">${groupe.nom}</h3>
      <p class="text-gray-600 text-sm">${
        groupe.description || "(Pas de description)"
      }</p>
      <p class="text-gray-700 text-sm mt-1">Membres : ${groupe.membres.join(
        ", "
      )}</p>
      <p class="text-gray-500 text-xs">Admin : ${groupe.admin}</p>
    `;

    listeGroupes.appendChild(li);
  });
}