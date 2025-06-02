// Variables globales
        let currentUser = null;
        let contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
        let groups = JSON.parse(localStorage.getItem('groups') || '[]');
        let diffusions = JSON.parse(localStorage.getItem('diffusions') || '[]');
        let archivedContacts = JSON.parse(localStorage.getItem('archivedContacts') || '[]');
        let conversations = JSON.parse(localStorage.getItem('conversations') || '{}');
        let drafts = JSON.parse(localStorage.getItem('drafts') || '{}');
        let userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        let currentSection = 'contacts';
        let selectedContact = null;
        let selectedGroup = null;
        let selectedDiffusion = null;
        let currentTarget = null;
        let managingGroupId = null;
        let alphabeticalSort = false;
        let isRecording = false;
        let mediaRecorder = null;
        let recordingStartTime = null;
        let recordingInterval = null;
        let currentCall = null;
        let callStartTime = null;
        let callInterval = null;
        

        // Système de popup personnalisé
        function showPopup(title, message, type = 'info', showCancel = false) {
            return new Promise((resolve) => {
                const popup = document.getElementById('customPopup');
                const popupIcon = document.getElementById('popupIcon');
                const popupTitle = document.getElementById('popupTitle');
                const popupMessage = document.getElementById('popupMessage');
                const popupConfirm = document.getElementById('popupConfirm');
                const popupCancel = document.getElementById('popupCancel');

                // Définir l'icône selon le type
                const icons = {
                    'info': 'fa-solid fa-info-circle text-blue-500',
                    'warning': 'fa-solid fa-exclamation-triangle text-yellow-500',
                    'error': 'fa-solid fa-times-circle text-red-500',
                    'success': 'fa-solid fa-check-circle text-green-500'
                };

                popupIcon.className = icons[type] || icons.info;
                popupTitle.textContent = title;
                popupMessage.textContent = message;

                if (showCancel) {
                    popupCancel.classList.remove('hidden');
                    popupCancel.onclick = () => {
                        popup.classList.add('hidden');
                        resolve(false);
                    };
                } else {
                    popupCancel.classList.add('hidden');
                }

                popupConfirm.onclick = () => {
                    popup.classList.add('hidden');
                    resolve(true);
                };

                popup.classList.remove('hidden');
            });
        }

        // Initialiser les contacts avec des statuts aléatoires
        function initializeContactsStatus() {
            contacts.forEach(contact => {
                if (contact.isOnline === undefined) {
                    contact.isOnline = Math.random() > 0.3; // 70% de chance d'être en ligne
                    contact.lastSeen = contact.isOnline ? new Date() : new Date(Date.now() - Math.random() * 86400000);
                }
            });
            saveToStorage();
        }

        // Simuler les changements de statut
        function simulateStatusChanges() {
            setInterval(() => {
                contacts.forEach(contact => {
                    // 10% de chance de changer de statut toutes les 30 secondes
                    if (Math.random() < 0.1) {
                        contact.isOnline = !contact.isOnline;
                        contact.lastSeen = new Date();
                        saveToStorage();
                        
                        // Mettre à jour l'affichage si nécessaire
                        if (currentSection === 'contacts') {
                            renderContacts();
                        }
                        if (selectedContact && selectedContact.id === contact.id) {
                            updateChatStatus();
                        }
                    }
                });
            }, 30000); // Toutes les 30 secondes
        }

        // Gestion des appels
        function startVoiceCall() {
            if (!selectedContact) return;
            
            currentCall = {
                type: 'voice',
                contact: selectedContact,
                status: 'connecting',
                startTime: null
            };
            
            showCallModal();
            
            // Simuler la connexion
            setTimeout(() => {
                if (currentCall) {
                    currentCall.status = 'connected';
                    currentCall.startTime = Date.now();
                    document.getElementById('callStatus').textContent = 'Connecté';
                    document.getElementById('callStatus').classList.remove('call-connecting');
                    document.getElementById('callDuration').classList.remove('hidden');
                    startCallTimer();
                }
            }, 3000);
        }

        function startVideoCall() {
            if (!selectedContact) return;
            
            currentCall = {
                type: 'video',
                contact: selectedContact,
                status: 'connecting',
                startTime: null
            };
            
            showVideoCallModal();
            
            // Simuler la connexion
            setTimeout(() => {
                if (currentCall) {
                    currentCall.status = 'connected';
                    currentCall.startTime = Date.now();
                    document.getElementById('videoCallStatus').textContent = 'Connecté';
                    document.getElementById('videoCallStatus').classList.remove('call-connecting');
                    document.getElementById('videoCallDuration').classList.remove('hidden');
                    startCallTimer();
                }
            }, 3000);
        }

        function showCallModal() {
            const modal = document.getElementById('callModal');
            const contactIcon = document.getElementById('callContactIcon');
            const contactName = document.getElementById('callContactName');
            
            contactIcon.innerHTML = `<div class="text-white font-bold w-full h-full flex items-center justify-center" style="background-color: ${getProfileColor(selectedContact.name)}">${getUserInitials(selectedContact.name)}</div>`;
            contactIcon.style.backgroundColor = getProfileColor(selectedContact.name);
            contactName.textContent = selectedContact.name;
            
            modal.classList.remove('hidden');
        }

        function showVideoCallModal() {
            const modal = document.getElementById('videoCallModal');
            const contactIcon = document.getElementById('videoCallContactIcon');
            const contactName = document.getElementById('videoCallContactName');
            
            contactIcon.innerHTML = `<div class="text-white font-bold w-full h-full flex items-center justify-center" style="background-color: ${getProfileColor(selectedContact.name)}">${getUserInitials(selectedContact.name)}</div>`;
            contactIcon.style.backgroundColor = getProfileColor(selectedContact.name);
            contactName.textContent = selectedContact.name;
            
            modal.classList.remove('hidden');
        }

        function endCall() {
            if (currentCall) {
                const duration = currentCall.startTime ? Math.floor((Date.now() - currentCall.startTime) / 1000) : 0;
                
                // Ajouter un message d'appel dans la conversation
                if (duration > 0) {
                    addCallMessage(currentCall.type, duration);
                }
                
                currentCall = null;
                
                if (callInterval) {
                    clearInterval(callInterval);
                    callInterval = null;
                }
            }
            
            document.getElementById('callModal').classList.add('hidden');
            document.getElementById('videoCallModal').classList.add('hidden');
        }

        function startCallTimer() {
            callInterval = setInterval(() => {
                if (currentCall && currentCall.startTime) {
                    const elapsed = Math.floor((Date.now() - currentCall.startTime) / 1000);
                    const minutes = Math.floor(elapsed / 60);
                    const seconds = elapsed % 60;
                    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    
                    if (currentCall.type === 'voice') {
                        document.getElementById('callDuration').textContent = timeString;
                    } else {
                        document.getElementById('videoCallDuration').textContent = timeString;
                    }
                }
            }, 1000);
        }

        function addCallMessage(type, duration) {
            const targetId = selectedContact.id;
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            const message = {
                id: Date.now().toString(),
                contenu: `Appel ${type === 'voice' ? 'vocal' : 'vidéo'} - Durée: ${durationText}`,
                type: 'call',
                callType: type,
                duration: duration,
                expediteur: 'moi',
                heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now(),
                statut: 'sent'
            };
            
            if (!conversations[targetId]) {
                conversations[targetId] = [];
            }
            
            conversations[targetId].push(message);
            saveToStorage();
            loadMessages();
            
            // Mettre à jour les listes
            if (currentSection === 'contacts') renderContacts();
        }

        function toggleMute(isVideo = false) {
            const btn = isVideo ? document.getElementById('muteVideoCallBtn') : document.getElementById('muteCallBtn');
            const icon = btn.querySelector('i');
            
            if (icon.classList.contains('fa-microphone')) {
                icon.classList.remove('fa-microphone');
                icon.classList.add('fa-microphone-slash');
                btn.classList.add('bg-red-600');
                btn.classList.remove('bg-gray-700');
            } else {
                icon.classList.remove('fa-microphone-slash');
                icon.classList.add('fa-microphone');
                btn.classList.remove('bg-red-600');
                btn.classList.add('bg-gray-700');
            }
        }

        function toggleCamera() {
            const btn = document.getElementById('cameraBtn');
            const icon = btn.querySelector('i');
            
            if (icon.classList.contains('fa-video')) {
                icon.classList.remove('fa-video');
                icon.classList.add('fa-video-slash');
                btn.classList.add('bg-red-600');
                btn.classList.remove('bg-gray-700');
            } else {
                icon.classList.remove('fa-video-slash');
                icon.classList.add('fa-video');
                btn.classList.remove('bg-red-600');
                btn.classList.add('bg-gray-700');
            }
        }

        function toggleSpeaker() {
            const btn = document.getElementById('speakerBtn');
            const icon = btn.querySelector('i');
            
            if (icon.classList.contains('fa-volume-up')) {
                icon.classList.remove('fa-volume-up');
                icon.classList.add('fa-volume-mute');
                btn.classList.add('bg-blue-600');
                btn.classList.remove('bg-gray-700');
            } else {
                icon.classList.remove('fa-volume-mute');
                icon.classList.add('fa-volume-up');
                btn.classList.remove('bg-blue-600');
                btn.classList.add('bg-gray-700');
            }
        }

        // Utilitaires
        function saveToStorage() {
            localStorage.setItem('contacts', JSON.stringify(contacts));
            localStorage.setItem('groups', JSON.stringify(groups));
            localStorage.setItem('diffusions', JSON.stringify(diffusions));
            localStorage.setItem('archivedContacts', JSON.stringify(archivedContacts));
            localStorage.setItem('conversations', JSON.stringify(conversations));
            localStorage.setItem('drafts', JSON.stringify(drafts));
            localStorage.setItem('userSettings', JSON.stringify(userSettings));
        }

        function getUserInitials(name) {
            const parts = name.split(' ');
            return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
        }

        function getProfileColor(name) {
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
            const index = name.charCodeAt(0) % colors.length;
            return colors[index];
        }

        function formatTime(timestamp) {
            const now = new Date();
            const messageDate = new Date(timestamp);
            const diffDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                return messageDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            } else if (diffDays === 1) {
                return 'Hier';
            } else if (diffDays < 7) {
                return messageDate.toLocaleDateString('fr-FR', { weekday: 'short' });
            } else {
                return messageDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
            }
        }

        function getLastMessage(targetId) {
            const messages = conversations[targetId];
            return messages && messages.length > 0 ? messages[messages.length - 1] : null;
        }

        function getUnreadCount(targetId) {
            const messages = conversations[targetId] || [];
            return messages.filter(msg => msg.expediteur !== 'moi' && !msg.vu).length;
        }

        function getMessageStatusIcon(status, isContactOnline = false) {
            switch (status) {
                case 'sent': 
                    return '<i class="fa-solid fa-check text-gray-400"></i>';
                case 'delivered': 
                    return '<i class="fa-solid fa-check-double text-gray-400"></i>';
                case 'read': 
                    return '<i class="fa-solid fa-check-double text-blue-500"></i>';
                default: 
                    return '';
            }
        }

        // Authentification
        document.getElementById('authForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const userName = document.getElementById('userName').value.trim();
            const phoneNumber = document.getElementById('phoneNumber').value.trim();
            const countryCode = document.getElementById('countrySelect').value;

            if (!userName || !phoneNumber) {
                return;
            }

            if (phoneNumber.length < 8) {
                return;
            }

            currentUser = {
                nom: userName,
                telephone: countryCode + phoneNumber,
                description: userSettings.description || 'Salut ! J\'utilise Kaeniou-Waxtane.',
                dateInscription: new Date().toLocaleDateString('fr-FR'),
                isOnline: true
            };

            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMainApp();
        });

        function showMainApp() {
            document.getElementById('authScreen').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            
            // Afficher les infos utilisateur
            const profileIcon = document.getElementById('profileIcon');
            const usernameDisplay = document.getElementById('usernameDisplay');
            
            profileIcon.textContent = getUserInitials(currentUser.nom);
            profileIcon.style.backgroundColor = getProfileColor(currentUser.nom);
            usernameDisplay.textContent = currentUser.nom;
            
            // Initialiser les statuts des contacts
            initializeContactsStatus();
            
            // Démarrer la simulation des changements de statut
            simulateStatusChanges();
            
            showSection('contacts');
        }

        // Navigation
        function showSection(section) {
            currentSection = section;
            
            // Cacher tous les contenus
            document.getElementById('newContactForm').classList.add('hidden');
            document.getElementById('contactList').classList.add('hidden');
            document.getElementById('archiveContainer').classList.add('hidden');
            document.getElementById('groupContainer').classList.add('hidden');
            document.getElementById('diffusionContainer').classList.add('hidden');
            document.getElementById('multiContactForm').classList.add('hidden');
            
            // Mettre à jour le titre
            const titles = {
                'contacts': 'DISCUSSION',
                'groupes': 'GROUPES',
                'diffusion': 'DIFFUSION',
                'archive': 'ARCHIVES',
                'nouveau': 'NOUVEAU CONTACT'
            };
            document.getElementById('sectionTitle').textContent = titles[section] || 'DISCUSSION';
            
            // Afficher le contenu approprié
            switch(section) {
                case 'nouveau':
                    document.getElementById('newContactForm').classList.remove('hidden');
                    document.getElementById('searchInput').style.display = 'none';
                    break;
                case 'contacts':
                    document.getElementById('contactList').classList.remove('hidden');
                    document.getElementById('searchInput').style.display = 'block';
                    renderContacts();
                    break;
                case 'archive':
                    document.getElementById('archiveContainer').classList.remove('hidden');
                    document.getElementById('searchInput').style.display = 'none';
                    renderArchive();
                    break;
                case 'groupes':
                    document.getElementById('groupContainer').classList.remove('hidden');
                    document.getElementById('searchInput').style.display = 'none';
                    renderGroups();
                    break;
                case 'diffusion':
                    document.getElementById('diffusionContainer').classList.remove('hidden');
                    document.getElementById('searchInput').style.display = 'none';
                    renderDiffusions();
                    break;
            }
            
            // Mettre à jour les boutons de navigation
            updateNavigationButtons(section);
        }

        function updateNavigationButtons(activeSection) {
            const buttons = ['messagesBtn', 'groupesBtn', 'diffusionBtn', 'archiveBtn', 'toggleBtn'];
            const sections = ['contacts', 'groupes', 'diffusion', 'archive', 'nouveau'];
            
            buttons.forEach((btnId, index) => {
                const btn = document.getElementById(btnId);
                if (sections[index] === activeSection) {
                    btn.classList.add('bg-amber-200');
                } else {
                    btn.classList.remove('bg-amber-200');
                }
            });
        }

        // Gestion des contacts
        function renderContacts() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            let filteredContacts = contacts;
            
            if (searchTerm === '*') {
                alphabeticalSort = true;
                document.getElementById('searchInput').value = '';
                filteredContacts = [...contacts].sort((a, b) => a.name.localeCompare(b.name));
            } else if (searchTerm) {
                filteredContacts = contacts.filter(contact => 
                    contact.name.toLowerCase().includes(searchTerm) || 
                    contact.tel.includes(searchTerm)
                );
            }
            
            if (alphabeticalSort && !searchTerm) {
                filteredContacts.sort((a, b) => a.name.localeCompare(b.name));
            } else if (!searchTerm) {
                // Trier par derniers messages
                filteredContacts.sort((a, b) => {
                    const lastMessageA = getLastMessage(a.id);
                    const lastMessageB = getLastMessage(b.id);
                    const timestampA = lastMessageA?.timestamp || 0;
                    const timestampB = lastMessageB?.timestamp || 0;
                    return timestampB - timestampA;
                });
            }
            
            const contactUl = document.getElementById('contactUl');
            contactUl.innerHTML = '';
            
            if (filteredContacts.length === 0) {
                contactUl.innerHTML = '<li class="text-center text-gray-500 py-8">Aucun contact trouvé</li>';
                return;
            }
            
            filteredContacts.forEach(contact => {
                const lastMessage = getLastMessage(contact.id);
                const unreadCount = getUnreadCount(contact.id);
                const hasDraft = drafts[contact.id];
                
                const li = document.createElement('li');
                li.className = 'flex items-center justify-between px-2 py-1 bg-white rounded shadow text-sm hover:bg-gray-50 cursor-pointer';
                li.onclick = () => selectContact(contact);
                
                li.innerHTML = `
                    <div class="flex items-center gap-2 contact-info flex-1">
                        <div class="w-8 h-8 rounded-full text-center leading-8 text-sm font-bold text-white profile-icon" 
                             style="background-color: ${getProfileColor(contact.name)}">
                            ${getUserInitials(contact.name)}
                        </div>
                        <div class="flex flex-col flex-1">
                            <div class="flex justify-between items-center">
                                <span class="font-medium">${contact.name}</span>
                                ${lastMessage ? `<span class="text-xs text-gray-500">${formatTime(lastMessage.timestamp)}</span>` : ''}
                            </div>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="${contact.isOnline ? 'status-online' : 'status-offline'} mr-2">
                                        <i class="fa-solid fa-circle"></i>
                                        <span class="text-xs">${contact.isOnline ? 'en ligne' : 'hors ligne'}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="text-xs text-gray-500">
                                ${hasDraft ? `<span class="draft-indicator">Brouillon: ${hasDraft.substring(0, 20)}...</span>` :
                                  lastMessage ? 
                                    (lastMessage.type === 'text' ? 
                                        lastMessage.contenu.substring(0, 20) + (lastMessage.contenu.length > 20 ? '...' : '') :
                                        lastMessage.type === 'image' ? '📷 Photo' :
                                        lastMessage.type === 'file' ? '📎 Fichier' : 
                                        lastMessage.type === 'audio' ? '🎵 Audio' :
                                        lastMessage.type === 'call' ? `📞 ${lastMessage.contenu}` : lastMessage.contenu
                                    ) : contact.tel
                                }
                            </div>
                        </div>
                        ${unreadCount > 0 ? `<span class="bg-green-500 text-white text-xs rounded-full px-2 py-1 ml-2">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
                    </div>
                    <div class="relative">
                        <button class="options-toggle" onclick="event.stopPropagation(); toggleContactMenu('${contact.id}')">
                            <i class="fa-solid fa-angle-down text-gray-600 cursor-pointer"></i>
                        </button>
                        <div id="menu-${contact.id}" class="options-menu hidden absolute right-0 mt-1 bg-white border rounded shadow text-xs z-10">
                            <ul>
                                <li class="archive-btn px-3 py-1 hover:bg-gray-100 cursor-pointer" onclick="event.stopPropagation(); archiveContact('${contact.id}')">Archiver</li>
                                <li class="delete-btn px-3 py-1 hover:bg-gray-100 cursor-pointer" onclick="event.stopPropagation(); deleteContact('${contact.id}')">Supprimer</li>
                            </ul>
                        </div>
                    </div>
                `;
                
                contactUl.appendChild(li);
            });
        }

        function toggleContactMenu(contactId) {
            // Fermer tous les autres menus
            document.querySelectorAll('.options-menu').forEach(menu => {
                if (menu.id !== `menu-${contactId}`) {
                    menu.classList.add('hidden');
                }
            });
            
            // Toggle le menu actuel
            const menu = document.getElementById(`menu-${contactId}`);
            menu.classList.toggle('hidden');
        }

        function selectContact(contact) {
            selectedContact = contact;
            selectedGroup = null;
            selectedDiffusion = null;
            currentTarget = contact;
            showChat();
        }

        async function archiveContact(contactId) {
            const contact = contacts.find(c => c.id === contactId);
            if (contact) {
                const confirmed = await showPopup(
                    'Archiver le contact',
                    `Voulez-vous vraiment archiver ${contact.name} ?`,
                    'warning',
                    true
                );
                
                if (confirmed) {
                    archivedContacts.push({
                        ...contact,
                        dateArchivage: new Date().toLocaleDateString('fr-FR')
                    });
                    contacts = contacts.filter(c => c.id !== contactId);
                    saveToStorage();
                    renderContacts();
                    hideContactMenu(contactId);
                    
                    // Si le contact archivé était sélectionné, fermer le chat
                    if (selectedContact && selectedContact.id === contactId) {
                        hideChat();
                    }
                }
            }
        }

        async function deleteContact(contactId) {
            const contact = contacts.find(c => c.id === contactId);
            if (contact) {
                const confirmed = await showPopup(
                    'Supprimer le contact',
                    `Voulez-vous vraiment supprimer ${contact.name} ? Cette action est irréversible.`,
                    'error',
                    true
                );
                
                if (confirmed) {
                    contacts = contacts.filter(c => c.id !== contactId);
                    delete conversations[contactId];
                    delete drafts[contactId];
                    saveToStorage();
                    renderContacts();
                    hideContactMenu(contactId);
                    
                    if (selectedContact && selectedContact.id === contactId) {
                        hideChat();
                    }
                }
            }
        }

        function hideContactMenu(contactId) {
            const menu = document.getElementById(`menu-${contactId}`);
            if (menu) menu.classList.add('hidden');
        }

        // Gestion des archives
        function renderArchive() {
            const archiveList = document.getElementById('archiveList');
            const emptyArchive = document.getElementById('emptyArchive');
            
            if (archivedContacts.length === 0) {
                archiveList.innerHTML = '';
                emptyArchive.classList.remove('hidden');
                return;
            }
            
            emptyArchive.classList.add('hidden');
            archiveList.innerHTML = '';
            
            archivedContacts.forEach(contact => {
                const div = document.createElement('div');
                div.className = 'flex items-center justify-between px-2 py-1 bg-amber-50 rounded shadow text-sm border border-amber-200';
                
                div.innerHTML = `
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-amber-200 text-center leading-8 text-sm font-bold text-amber-700">
                            ${getUserInitials(contact.name)}
                        </div>
                        <div class="flex flex-col">
                            <span class="contact-text font-medium">${contact.name}</span>
                            <span class="text-xs text-gray-500">${contact.tel}</span>
                            ${contact.dateArchivage ? `<span class="text-xs text-amber-600">Archivé le ${contact.dateArchivage}</span>` : ''}
                        </div>
                    </div>
                    <div class="relative">
                        <button class="options-toggle" onclick="toggleArchiveMenu('${contact.id}')">
                            <i class="fa-solid fa-angle-down text-gray-600 cursor-pointer"></i>
                        </button>
                        <div id="archive-menu-${contact.id}" class="options-menu hidden absolute right-0 mt-1 bg-white border rounded shadow text-xs z-10">
                            <ul>
                                <li class="restore-btn px-3 py-1 hover:bg-gray-100 cursor-pointer" onclick="restoreContact('${contact.id}')">Restaurer</li>
                                <li class="delete-archive-btn px-3 py-1 hover:bg-gray-100 cursor-pointer" onclick="deleteArchivedContact('${contact.id}')">Supprimer</li>
                            </ul>
                        </div>
                    </div>
                `;
                
                archiveList.appendChild(div);
            });
        }

        function toggleArchiveMenu(contactId) {
            document.querySelectorAll('.options-menu').forEach(menu => {
                if (menu.id !== `archive-menu-${contactId}`) {
                    menu.classList.add('hidden');
                }
            });
            
            const menu = document.getElementById(`archive-menu-${contactId}`);
            if (menu) {
                menu.classList.toggle('hidden');
            }
        }

        function restoreContact(contactId) {
            const contact = archivedContacts.find(c => c.id === contactId);
            if (contact) {
                const { dateArchivage, ...restoredContact } = contact;
                contacts.push(restoredContact);
                archivedContacts = archivedContacts.filter(c => c.id !== contactId);
                saveToStorage();
                renderArchive();
                
                // Fermer le menu
                const menu = document.getElementById(`archive-menu-${contactId}`);
                if (menu) menu.classList.add('hidden');
            }
        }

        async function deleteArchivedContact(contactId) {
            const contact = archivedContacts.find(c => c.id === contactId);
            if (contact) {
                const confirmed = await showPopup(
                    'Supprimer définitivement',
                    `Voulez-vous vraiment supprimer définitivement ${contact.name} ?`,
                    'error',
                    true
                );
                
                if (confirmed) {
                    archivedContacts = archivedContacts.filter(c => c.id !== contactId);
                    delete conversations[contactId];
                    delete drafts[contactId];
                    saveToStorage();
                    renderArchive();
                    
                    // Fermer le menu
                    const menu = document.getElementById(`archive-menu-${contactId}`);
                    if (menu) menu.classList.add('hidden');
                }
            }
        }

        // Gestion des groupes
        function renderGroups() {
            const groupList = document.getElementById('groupList');
            groupList.innerHTML = '';
            
            if (groups.length === 0) {
                groupList.innerHTML = '<li class="text-center text-gray-500 py-8">Aucun groupe créé</li>';
                return;
            }
            
            groups.forEach(group => {
                const lastMessage = getLastMessage(`groupe_${group.id}`);
                const hasDraft = drafts[`groupe_${group.id}`];
                
                const li = document.createElement('li');
                li.className = 'p-2 bg-white rounded mb-2 shadow relative cursor-pointer hover:bg-gray-50';
                li.onclick = () => selectGroup(group);
                
                li.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2 flex-1">
                            <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold cursor-pointer" onclick="event.stopPropagation(); manageGroup('${group.id}')">
                                <i class="fa-solid fa-users"></i>
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between items-center">
                                    <span class="font-medium">${group.nom}</span>
                                    ${lastMessage ? `<span class="text-xs text-gray-500">${formatTime(lastMessage.timestamp)}</span>` : ''}
                                </div>
                                <div class="text-xs text-gray-500">
                                    ${group.membres.length} membres
                                </div>
                                ${hasDraft ? `<div class="text-xs draft-indicator">Brouillon: ${hasDraft.substring(0, 20)}...</div>` :
                                  lastMessage ? `<div class="text-xs text-gray-600">${lastMessage.contenu.substring(0, 30)}...</div>` : ''}
                            </div>
                        </div>
                        <button class="text-red-500 hover:text-red-700 p-1" onclick="event.stopPropagation(); deleteGroup('${group.id}')">
                            <i class="fa-solid fa-trash text-sm"></i>
                        </button>
                    </div>
                `;
                
                groupList.appendChild(li);
            });
        }

        function selectGroup(group) {
            selectedGroup = group;
            selectedContact = null;
            selectedDiffusion = null;
            currentTarget = group;
            showChat();
        }

        async function deleteGroup(groupId) {
            const group = groups.find(g => g.id === groupId);
            if (group) {
                const confirmed = await showPopup(
                    'Supprimer le groupe',
                    `Voulez-vous vraiment supprimer le groupe "${group.nom}" ?`,
                    'error',
                    true
                );
                
                if (confirmed) {
                    groups = groups.filter(g => g.id !== groupId);
                    delete conversations[`groupe_${groupId}`];
                    delete drafts[`groupe_${groupId}`];
                    saveToStorage();
                    renderGroups();
                    
                    if (selectedGroup && selectedGroup.id === groupId) {
                        hideChat();
                    }
                }
            }
        }

        function manageGroup(groupId) {
            managingGroupId = groupId;
            const group = groups.find(g => g.id === groupId);
            if (!group) return;
            
            // Remplir les informations du groupe
            document.getElementById('groupManageName').textContent = group.nom;
            document.getElementById('groupManageDescription').textContent = group.description || 'Aucune description';
            document.getElementById('groupMemberCount').textContent = `${group.membres.length} membres`;
            
            // Afficher les contacts disponibles pour ajouter
            const availableContacts = document.getElementById('availableContacts');
            availableContacts.innerHTML = '';
            
            const nonMembers = contacts.filter(c => !group.membres.includes(c.name) && !c.isArchived);
            
            if (nonMembers.length > 0) {
                nonMembers.forEach(contact => {
                    const div = document.createElement('div');
                    div.className = 'flex items-center justify-between p-2 bg-gray-50 rounded';
                    div.innerHTML = `
                        <div class="flex items-center">
                            <div class="w-6 h-6 rounded-full text-center leading-6 text-xs font-bold text-white mr-2" style="background-color: ${getProfileColor(contact.name)}">
                                ${getUserInitials(contact.name)}
                            </div>
                            <span class="text-sm">${contact.name}</span>
                        </div>
                        <button class="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600" onclick="addMemberToGroup('${groupId}', '${contact.name}')">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    `;
                    availableContacts.appendChild(div);
                });
            } else {
                availableContacts.innerHTML = '<p class="text-sm text-gray-500">Tous vos contacts sont déjà membres</p>';
            }
            
            // Afficher les membres actuels
            const membersList = document.getElementById('groupMembersList');
            membersList.innerHTML = '';
            
            group.membres.forEach(memberName => {
                const isAdmin = group.admin === memberName;
                
                const div = document.createElement('div');
                div.className = 'flex items-center justify-between p-2 bg-gray-50 rounded';
                
                div.innerHTML = `
                    <div class="flex items-center">
                        <div class="w-6 h-6 rounded-full text-center leading-6 text-xs font-bold text-white mr-2" style="background-color: ${getProfileColor(memberName)}">
                            ${getUserInitials(memberName)}
                        </div>
                        <span class="text-sm">${memberName} ${isAdmin ? '(Admin)' : ''}</span>
                    </div>
                    <div class="flex space-x-1">
                        ${!isAdmin ? `<button class="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600" onclick="promoteToAdmin('${groupId}', '${memberName}')">Admin</button>` : ''}
                        ${isAdmin && group.membres.length > 1 ? `<button class="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600" onclick="demoteAdmin('${groupId}')">Rétrograder</button>` : ''}
                        ${group.membres.length > 1 ? `<button class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600" onclick="removeMember('${groupId}', '${memberName}')">Retirer</button>` : ''}
                    </div>
                `;
                
                membersList.appendChild(div);
            });
            
            document.getElementById('groupManageModal').classList.remove('hidden');
        }

        function addMemberToGroup(groupId, memberName) {
            const group = groups.find(g => g.id === groupId);
            if (group && !group.membres.includes(memberName)) {
                group.membres.push(memberName);
                groups = groups.map(g => g.id === groupId ? group : g);
                saveToStorage();
                manageGroup(groupId); // Rafraîchir la modal
                renderGroups(); // Rafraîchir la liste
                
                // Mettre à jour le chat si ce groupe est sélectionné
                if (selectedGroup && selectedGroup.id === groupId) {
                    selectedGroup = group;
                    updateChatStatus();
                }
            }
        }

        function promoteToAdmin(groupId, memberName) {
            const group = groups.find(g => g.id === groupId);
            if (group) {
                group.admin = memberName;
                groups = groups.map(g => g.id === groupId ? group : g);
                saveToStorage();
                manageGroup(groupId);
                renderGroups();
            }
        }

        function demoteAdmin(groupId) {
            const group = groups.find(g => g.id === groupId);
            if (group && group.membres.length > 1) {
                const newAdmin = group.membres.find(m => m !== group.admin);
                if (newAdmin) {
                    group.admin = newAdmin;
                    groups = groups.map(g => g.id === groupId ? group : g);
                    saveToStorage();
                    manageGroup(groupId);
                    renderGroups();
                }
            }
        }

        async function removeMember(groupId, memberName) {
            const group = groups.find(g => g.id === groupId);
            if (group && group.membres.length > 1) {
                const confirmed = await showPopup(
                    'Retirer le membre',
                    `Voulez-vous vraiment retirer ${memberName} du groupe ?`,
                    'warning',
                    true
                );
                
                if (confirmed) {
                    group.membres = group.membres.filter(m => m !== memberName);
                    if (group.admin === memberName && group.membres.length > 0) {
                        group.admin = group.membres[0];
                    }
                    groups = groups.map(g => g.id === groupId ? group : g);
                    saveToStorage();
                    manageGroup(groupId);
                    renderGroups();
                    
                    // Mettre à jour le chat si ce groupe est sélectionné
                    if (selectedGroup && selectedGroup.id === groupId) {
                        selectedGroup = group;
                        updateChatStatus();
                    }
                }
            }
        }

        // Gestion des diffusions
        function renderDiffusions() {
            const diffusionList = document.getElementById('diffusionList');
            diffusionList.innerHTML = '';
            
            if (diffusions.length === 0) {
                diffusionList.innerHTML = '<li class="text-center text-gray-500 py-8">Aucune diffusion créée</li>';
                return;
            }
            
            diffusions.forEach(diffusion => {
                const lastMessage = getLastMessage(`diffusion_${diffusion.id}`);
                const hasDraft = drafts[`diffusion_${diffusion.id}`];
                
                const li = document.createElement('li');
                li.className = 'p-2 bg-white rounded mb-2 shadow relative cursor-pointer hover:bg-gray-50';
                li.onclick = () => selectDiffusion(diffusion);
                
                li.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2 flex-1">
                            <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                                <i class="fa-solid fa-arrows-turn-to-dots"></i>
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between items-center">
                                    <span class="font-medium">${diffusion.nom}</span>
                                    ${lastMessage ? `<span class="text-xs text-gray-500">${formatTime(lastMessage.timestamp)}</span>` : ''}
                                </div>
                                <div class="text-xs text-gray-500">
                                    ${diffusion.recipients.length} destinataires
                                </div>
                                ${hasDraft ? `<div class="text-xs draft-indicator">Brouillon: ${hasDraft.substring(0, 20)}...</div>` :
                                  lastMessage ? `<div class="text-xs text-gray-600">${lastMessage.contenu.substring(0, 30)}...</div>` : ''}
                            </div>
                        </div>
                        <button class="text-red-500 hover:text-red-700 p-1" onclick="event.stopPropagation(); deleteDiffusion('${diffusion.id}')">
                                                                                            <i class="fa-solid fa-trash text-sm"></i>
                        </button>
                    </div>
                `;
                
                diffusionList.appendChild(li);
            });
        }

        function selectDiffusion(diffusion) {
            selectedDiffusion = diffusion;
            selectedContact = null;
            selectedGroup = null;
            currentTarget = diffusion;
            showChat();
        }

        async function deleteDiffusion(diffusionId) {
            const diffusion = diffusions.find(d => d.id === diffusionId);
            if (diffusion) {
                const confirmed = await showPopup(
                    'Supprimer la diffusion',
                    `Voulez-vous vraiment supprimer la diffusion "${diffusion.nom}" ?`,
                    'error',
                    true
                );
                
                if (confirmed) {
                    diffusions = diffusions.filter(d => d.id !== diffusionId);
                    delete conversations[`diffusion_${diffusionId}`];
                    delete drafts[`diffusion_${diffusionId}`];
                    saveToStorage();
                    renderDiffusions();
                    
                    if (selectedDiffusion && selectedDiffusion.id === diffusionId) {
                        hideChat();
                    }
                }
            }
        }

        // Gestion des messages multi-contacts
        function showMultiContactForm() {
            document.getElementById('multiContactForm').classList.remove('hidden');
            
            // Remplir les checkboxes
            const checkboxes = document.getElementById('multiContactCheckboxes');
            checkboxes.innerHTML = '';
            
            contacts.filter(c => !c.isArchived).forEach(contact => {
                const div = document.createElement('div');
                div.className = 'flex items-center space-x-2';
                div.innerHTML = `
                    <input type="checkbox" id="multi-contact-${contact.id}" value="${contact.name}" onchange="updateMultiSelectedCount()">
                    <label for="multi-contact-${contact.id}" class="text-sm">${contact.name}</label>
                `;
                checkboxes.appendChild(div);
            });
        }

        function updateMultiSelectedCount() {
            const selectedCount = document.querySelectorAll('#multiContactCheckboxes input[type="checkbox"]:checked').length;
            document.getElementById('multiSelectedCount').textContent = `${selectedCount} destinataire(s) sélectionné(s)`;
        }

        async function sendMultiMessage() {
            const messageText = document.getElementById('multiMessage').value.trim();
            const selectedRecipients = Array.from(document.querySelectorAll('#multiContactCheckboxes input[type="checkbox"]:checked')).map(cb => cb.value);
            
            if (!messageText || selectedRecipients.length === 0) {
                await showPopup('Erreur', 'Veuillez saisir un message et sélectionner au moins un destinataire', 'error');
                return;
            }
            
            // Créer une nouvelle diffusion automatiquement
            const newDiffusion = {
                id: Date.now().toString(),
                nom: `Diffusion ${new Date().toLocaleDateString('fr-FR')}`,
                recipients: selectedRecipients
            };
            
            diffusions.push(newDiffusion);
            
            // Envoyer le message à la diffusion
            const targetId = `diffusion_${newDiffusion.id}`;
            const message = {
                id: Date.now().toString(),
                contenu: messageText,
                type: 'text',
                expediteur: 'moi',
                heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now(),
                statut: 'sent'
            };
            
            if (!conversations[targetId]) {
                conversations[targetId] = [];
            }
            
            conversations[targetId].push(message);
            saveToStorage();
            
            // Réinitialiser le formulaire
            document.getElementById('multiMessage').value = '';
            document.querySelectorAll('#multiContactCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
            updateMultiSelectedCount();
            document.getElementById('multiContactForm').classList.add('hidden');
            
            // Aller à la section diffusion et sélectionner la nouvelle diffusion
            showSection('diffusion');
            setTimeout(() => {
                selectDiffusion(newDiffusion);
            }, 100);
        }

        // Chat
        function showChat() {
            document.getElementById('defaultMessage').classList.add('hidden');
            document.getElementById('chatHeader').classList.remove('hidden');
            document.getElementById('chatMessages').classList.remove('hidden');
            document.getElementById('chatInput').classList.remove('hidden');
            
            // Mettre à jour l'en-tête du chat
            const chatContactIcon = document.getElementById('chatContactIcon');
            const chatContactName = document.getElementById('chatContactName');
            const chatContactStatus = document.getElementById('chatContactStatus');
            const voiceCallBtn = document.getElementById('voiceCallBtn');
            const videoCallBtn = document.getElementById('videoCallBtn');
            
            if (selectedContact) {
                chatContactIcon.innerHTML = `<div class="text-white font-bold w-full h-full flex items-center justify-center" style="background-color: ${getProfileColor(selectedContact.name)}">${getUserInitials(selectedContact.name)}</div>`;
                chatContactIcon.style.backgroundColor = getProfileColor(selectedContact.name);
                chatContactIcon.onclick = null;
                chatContactName.textContent = selectedContact.name;
                updateChatStatus();
                
                // Afficher les boutons d'appel pour les contacts individuels
                voiceCallBtn.classList.remove('hidden');
                videoCallBtn.classList.remove('hidden');
            } else if (selectedGroup) {
                chatContactIcon.innerHTML = '<i class="fa-solid fa-users text-white"></i>';
                chatContactIcon.style.backgroundColor = '#10b981';
                chatContactIcon.onclick = () => manageGroup(selectedGroup.id);
                chatContactName.textContent = selectedGroup.nom;
                chatContactStatus.textContent = `${selectedGroup.membres.length} membres`;
                
                // Cacher les boutons d'appel pour les groupes
                voiceCallBtn.classList.add('hidden');
                videoCallBtn.classList.add('hidden');
            } else if (selectedDiffusion) {
                chatContactIcon.innerHTML = '<i class="fa-solid fa-arrows-turn-to-dots text-white"></i>';
                chatContactIcon.style.backgroundColor = '#8b5cf6';
                chatContactIcon.onclick = null;
                chatContactName.textContent = selectedDiffusion.nom;
                chatContactStatus.textContent = `${selectedDiffusion.recipients.length} destinataires`;
                
                // Cacher les boutons d'appel pour les diffusions
                voiceCallBtn.classList.add('hidden');
                videoCallBtn.classList.add('hidden');
            }
            
            // Charger les messages
            loadMessages();
            
            // Charger le brouillon
            const targetId = selectedContact?.id || `groupe_${selectedGroup?.id}` || `diffusion_${selectedDiffusion?.id}`;
            if (drafts[targetId]) {
                document.getElementById('messageInput').value = drafts[targetId];
                document.getElementById('draftIndicator').classList.remove('hidden');
            } else {
                document.getElementById('messageInput').value = '';
                document.getElementById('draftIndicator').classList.add('hidden');
            }
        }

        function updateChatStatus() {
            if (selectedContact) {
                const chatContactStatus = document.getElementById('chatContactStatus');
                chatContactStatus.innerHTML = selectedContact.isOnline ? 
                    '<div class="status-online"><i class="fa-solid fa-circle"></i> <span>en ligne</span></div>' : 
                    `<div class="status-offline"><i class="fa-solid fa-circle"></i> <span>hors ligne • ${formatTime(selectedContact.lastSeen)}</span></div>`;
            }
        }

        function hideChat() {
            selectedContact = null;
            selectedGroup = null;
            selectedDiffusion = null;
            currentTarget = null;
            
            document.getElementById('chatHeader').classList.add('hidden');
            document.getElementById('chatMessages').classList.add('hidden');
            document.getElementById('chatInput').classList.add('hidden');
            document.getElementById('defaultMessage').classList.remove('hidden');
            document.getElementById('draftIndicator').classList.add('hidden');
        }

        function loadMessages() {
            const targetId = selectedContact?.id || `groupe_${selectedGroup?.id}` || `diffusion_${selectedDiffusion?.id}`;
            const messages = conversations[targetId] || [];
            const messagesList = document.getElementById('messagesList');
            
            messagesList.innerHTML = '';
            
            messages.forEach(message => {
                const isMyMessage = message.expediteur === 'moi';
                const showSender = (selectedGroup || selectedDiffusion) && !isMyMessage && message.expediteur !== 'contact';
                
                const div = document.createElement('div');
                div.className = `message flex mb-2 ${isMyMessage ? 'justify-end' : 'justify-start'}`;
                
                let messageContent = '';
                if (message.type === 'text') {
                    messageContent = message.contenu;
                } else if (message.type === 'image') {
                    messageContent = `<img src="${message.contenu}" alt="Image" class="max-w-full rounded mb-2 cursor-pointer" onclick="window.open('${message.contenu}', '_blank')">`;
                } else if (message.type === 'file') {
                    messageContent = `<div class="flex items-center gap-2 bg-gray-100 p-2 rounded"><i class="fa-solid fa-file text-gray-600"></i><a href="${message.contenu}" download="${message.nom}" class="text-blue-600 hover:underline">${message.nom}</a></div>`;
                } else if (message.type === 'audio') {
                    messageContent = `<div class="flex items-center gap-2 bg-gray-100 p-2 rounded"><i class="fa-solid fa-microphone text-gray-600"></i><audio controls class="max-w-full"><source src="${message.contenu}" type="audio/mpeg">Votre navigateur ne supporte pas l'audio.</audio></div>`;
                } else if (message.type === 'call') {
                    const callIcon = message.callType === 'voice' ? 'fa-phone' : 'fa-video';
                    const callColor = isMyMessage ? 'text-green-600' : 'text-blue-600';
                    messageContent = `<div class="flex items-center gap-2 p-2 rounded"><i class="fa-solid ${callIcon} ${callColor}"></i><span>${message.contenu}</span></div>`;
                } else {
                    messageContent = message.contenu;
                }
                
                div.innerHTML = `
                    <div class="max-w-xs p-3 rounded-lg ${isMyMessage ? 'message-bubble-sent' : 'message-bubble-received'}">
                        ${showSender ? `<div class="text-xs font-medium text-green-600 mb-1">${message.expediteur}</div>` : ''}
                        <div class="message-text">
                            ${messageContent}
                        </div>
                        <div class="message-time text-xs text-gray-500 mt-1 flex justify-end items-center gap-1">
                            <span>${message.heure}</span>
                            ${isMyMessage && message.statut ? `<span>${getMessageStatusIcon(message.statut, selectedContact?.isOnline)}</span>` : ''}
                        </div>
                    </div>
                `;
                
                messagesList.appendChild(div);
            });
            
            // Scroll vers le bas
            messagesList.scrollTop = messagesList.scrollHeight;
        }

        function sendMessage() {
            const messageInput = document.getElementById('messageInput');
            const messageText = messageInput.value.trim();
            
            if (!messageText || !currentTarget) return;
            
            const targetId = selectedContact?.id || `groupe_${selectedGroup?.id}` || `diffusion_${selectedDiffusion?.id}`;
            
            const message = {
                id: Date.now().toString(),
                contenu: messageText,
                type: 'text',
                expediteur: 'moi',
                heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now(),
                statut: 'sent'
            };
            
            if (!conversations[targetId]) {
                conversations[targetId] = [];
            }
            
            conversations[targetId].push(message);
            
            // Effacer le brouillon
            delete drafts[targetId];
            document.getElementById('draftIndicator').classList.add('hidden');
            
            saveToStorage();
            messageInput.value = '';
            loadMessages();
            
            // Mettre à jour les listes
            if (currentSection === 'contacts') renderContacts();
            if (currentSection === 'groupes') renderGroups();
            if (currentSection === 'diffusion') renderDiffusions();
            
            // Simuler les statuts de message
            setTimeout(() => {
                const messageIndex = conversations[targetId].findIndex(m => m.id === message.id);
                if (messageIndex !== -1) {
                    conversations[targetId][messageIndex].statut = 'delivered';
                    saveToStorage();
                    loadMessages();
                }
            }, 1000);
            
            // Simuler la lecture si le contact est en ligne
            if (selectedContact?.isOnline) {
                setTimeout(() => {
                    const messageIndex = conversations[targetId].findIndex(m => m.id === message.id);
                    if (messageIndex !== -1) {
                        conversations[targetId][messageIndex].statut = 'read';
                        saveToStorage();
                        loadMessages();
                    }
                }, 2000);
            }
            
            // Simuler une réponse
            setTimeout(() => simulateResponse(targetId), Math.random() * 3000 + 1000);
        }

        function simulateResponse(targetId) {
            const responses = [
                'Salut ! Comment ça va ?',
                'Merci pour ton message !',
                'Je vais bien, et toi ?',
                'D\'accord, je te tiens au courant',
                'Super ! 👍',
                'À bientôt !',
                'C\'est noté 📝',
                'Parfait !',
                'Je suis occupé(e) là, on se parle plus tard ?',
                'Excellent ! 😊'
            ];
            
            const responseMessage = {
                id: Date.now().toString(),
                contenu: responses[Math.floor(Math.random() * responses.length)],
                type: 'text',
                expediteur: selectedGroup ? 
                    selectedGroup.membres[Math.floor(Math.random() * selectedGroup.membres.length)] : 
                    'contact',
                heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now()
            };
            
            if (!conversations[targetId]) {
                conversations[targetId] = [];
            }
            
            conversations[targetId].push(responseMessage);
            saveToStorage();
            
            if (currentTarget) {
                loadMessages();
            }
            
            // Mettre à jour les listes
            if (currentSection === 'contacts') renderContacts();
            if (currentSection === 'groupes') renderGroups();
            if (currentSection === 'diffusion') renderDiffusions();
        }

        function saveDraft() {
            const messageInput = document.getElementById('messageInput');
            const targetId = selectedContact?.id || `groupe_${selectedGroup?.id}` || `diffusion_${selectedDiffusion?.id}`;
            
            if (targetId) {
                if (messageInput.value.trim()) {
                    drafts[targetId] = messageInput.value;
                    document.getElementById('draftIndicator').classList.remove('hidden');
                } else {
                    delete drafts[targetId];
                    document.getElementById('draftIndicator').classList.add('hidden');
                }
                saveToStorage();
                
                // Mettre à jour les listes pour afficher les brouillons
                if (currentSection === 'contacts') renderContacts();
                if (currentSection === 'groupes') renderGroups();
                if (currentSection === 'diffusion') renderDiffusions();
            }
        }

        // Gestion de l'enregistrement audio
        function startRecording() {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showPopup('Erreur', 'L\'enregistrement audio n\'est pas supporté par votre navigateur', 'error');
                return;
            }

            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    mediaRecorder = new MediaRecorder(stream);
                    const audioChunks = [];

                    mediaRecorder.ondataavailable = event => {
                        audioChunks.push(event.data);
                    };

                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        const audioUrl = URL.createObjectURL(audioBlob);
                        
                        // Envoyer le message audio
                        sendAudioMessage(audioUrl);
                        
                        // Arrêter le stream
                        stream.getTracks().forEach(track => track.stop());
                    };

                    mediaRecorder.start();
                    isRecording = true;
                    recordingStartTime = Date.now();
                    
                    // Afficher l'indicateur d'enregistrement
                    document.getElementById('recordingIndicator').classList.remove('hidden');
                    document.getElementById('audioBtn').classList.add('recording');
                    
                    // Démarrer le timer
                    recordingInterval = setInterval(updateRecordingTime, 1000);
                })
                .catch(error => {
                    console.error('Erreur lors de l\'accès au microphone:', error);
                    showPopup('Erreur', 'Impossible d\'accéder au microphone', 'error');
                });
        }

        function stopRecording() {
            if (mediaRecorder && isRecording) {
                mediaRecorder.stop();
                isRecording = false;
                
                // Cacher l'indicateur d'enregistrement
                document.getElementById('recordingIndicator').classList.add('hidden');
                document.getElementById('audioBtn').classList.remove('recording');
                
                // Arrêter le timer
                if (recordingInterval) {
                    clearInterval(recordingInterval);
                    recordingInterval = null;
                }
            }
        }

        function updateRecordingTime() {
            if (recordingStartTime) {
                const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                document.getElementById('recordingTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }

        function sendAudioMessage(audioUrl) {
            if (!currentTarget) return;
            
            const targetId = selectedContact?.id || `groupe_${selectedGroup?.id}` || `diffusion_${selectedDiffusion?.id}`;
            
            const message = {
                id: Date.now().toString(),
                contenu: audioUrl,
                type: 'audio',
                nom: 'Message vocal',
                expediteur: 'moi',
                heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now(),
                statut: 'sent'
            };
            
            if (!conversations[targetId]) {
                conversations[targetId] = [];
            }
            
            conversations[targetId].push(message);
            saveToStorage();
            loadMessages();
            
            // Mettre à jour les listes
            if (currentSection === 'contacts') renderContacts();
            if (currentSection === 'groupes') renderGroups();
            if (currentSection === 'diffusion') renderDiffusions();
        }

        // Gestion des paramètres utilisateur
        function showUserSettings() {
            document.getElementById('settingsProfileIcon').textContent = getUserInitials(currentUser.nom);
            document.getElementById('settingsProfileIcon').style.backgroundColor = getProfileColor(currentUser.nom);
            document.getElementById('settingsUserName').textContent = currentUser.nom;
            document.getElementById('settingsUserDescription').textContent = currentUser.description || 'Salut ! J\'utilise Kaeniou-Waxtane.';
            
            document.getElementById('userSettingsModal').classList.remove('hidden');
        }

        function showEditProfile() {
            document.getElementById('editUserName').value = currentUser.nom;
            document.getElementById('editUserDescription').value = currentUser.description || '';
            document.getElementById('editProfileModal').classList.remove('hidden');
        }

        function handleFileUpload(file, type) {
            if (!currentTarget) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const targetId = selectedContact?.id || `groupe_${selectedGroup?.id}` || `diffusion_${selectedDiffusion?.id}`;
                
                const message = {
                    id: Date.now().toString(),
                    contenu: e.target.result,
                    type: type,
                    nom: file.name,
                    expediteur: 'moi',
                    heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    timestamp: Date.now(),
                    statut: 'sent'
                };
                
                if (!conversations[targetId]) {
                    conversations[targetId] = [];
                }
                
                conversations[targetId].push(message);
                saveToStorage();
                loadMessages();
            };
            reader.readAsDataURL(file);
        }

        // Event Listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Vérifier si l'utilisateur est déjà connecté
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                currentUser = JSON.parse(savedUser);
                showMainApp();
            }
            
            // Navigation
            document.getElementById('messagesBtn').onclick = () => showSection('contacts');
            document.getElementById('groupesBtn').onclick = () => showSection('groupes');
            document.getElementById('diffusionBtn').onclick = () => showSection('diffusion');
            document.getElementById('archiveBtn').onclick = () => showSection('archive');
            document.getElementById('toggleBtn').onclick = () => showSection('nouveau');
            
            // Paramètres utilisateur
            document.getElementById('userInfo').onclick = showUserSettings;
            document.getElementById('closeUserSettings').onclick = () => {
                document.getElementById('userSettingsModal').classList.add('hidden');
            };
            document.getElementById('editProfile').onclick = () => {
                document.getElementById('userSettingsModal').classList.add('hidden');
                showEditProfile();
            };
            document.getElementById('logoutBtn').onclick = () => {
                localStorage.removeItem('currentUser');
                location.reload();
            };
            
            // Édition de profil
            document.getElementById('editProfileForm').onsubmit = function(e) {
                e.preventDefault();
                
                const newName = document.getElementById('editUserName').value.trim();
                const newDescription = document.getElementById('editUserDescription').value.trim();
                
                if (newName) {
                    currentUser.nom = newName;
                    currentUser.description = newDescription;
                    
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    // Mettre à jour l'interface
                    document.getElementById('profileIcon').textContent = getUserInitials(currentUser.nom);
                    document.getElementById('profileIcon').style.backgroundColor = getProfileColor(currentUser.nom);
                    document.getElementById('usernameDisplay').textContent = currentUser.nom;
                    
                    document.getElementById('editProfileModal').classList.add('hidden');
                }
            };
            
            // Recherche
            document.getElementById('searchInput').oninput = () => {
                if (currentSection === 'contacts') {
                    renderContacts();
                }
            };
            
            // Nouveau contact
            document.getElementById('newContactForm').onsubmit = async function(e) {
                e.preventDefault();

                const name = document.getElementById('contactName').value.trim();
                const tel = document.getElementById('contactTel').value.trim();

                if (!name || !tel) {
                    await showPopup('Erreur', 'Veuillez remplir tous les champs', 'error');
                    return;
                }

                // Vérifier si le numéro existe déjà
                const telExists = contacts.some(c => c.tel === tel);
                if (telExists) {
                    await showPopup('Erreur', 'Ce numéro existe déjà dans vos contacts.', 'error');
                    return;
                }

                // Trouver tous les contacts qui commencent par le même nom (ex: Ali, Ali2, Ali3)
                const regex = new RegExp(`^${name}(\\d+)?$`);
                const sameNameContacts = contacts.filter(c => regex.test(c.name));

                let contactName = name;
                if (sameNameContacts.length > 0) {
                    // Chercher le plus grand numéro déjà utilisé
                    let maxNumber = 1;
                    sameNameContacts.forEach(contact => {
                        const match = contact.name.match(new RegExp(`^${name}(\\d+)?$`));
                        if (match && match[1]) {
                            const num = parseInt(match[1]);
                            if (num > maxNumber) maxNumber = num;
                        }
                    });
                    contactName = `${name}${maxNumber + 1}`;
                }

                const newContact = {
                    id: Date.now().toString(),
                    name: contactName,
                    tel: tel,
                    isOnline: Math.random() > 0.3,
                    lastSeen: new Date()
                };

                contacts.push(newContact);
                saveToStorage();

                document.getElementById('contactName').value = '';
                document.getElementById('contactTel').value = '';

                await showPopup('Succès', `Contact ajouté comme ${contactName}`, 'success');
                showSection('contacts');
            };

            
            // Création de groupe
            document.getElementById('showCreateGroup').onclick = async () => {
                if (contacts.length < 2) {
                    await showPopup('Erreur', 'Vous devez avoir au moins 2 contacts pour créer un groupe', 'error');
                    return;
                }
                
                document.getElementById('showCreateGroup').classList.add('hidden');
                document.getElementById('createGroupForm').classList.remove('hidden');
                
                // Remplir les checkboxes
                const checkboxes = document.getElementById('contactCheckboxes');
                checkboxes.innerHTML = '';
                
                contacts.forEach(contact => {
                    const div = document.createElement('div');
                    div.className = 'flex items-center space-x-2';
                    div.innerHTML = `
                        <input type="checkbox" id="member-${contact.id}" value="${contact.name}" onchange="updateSelectedCount()">
                        <label for="member-${contact.id}" class="text-sm">${contact.name}</label>
                    `;
                    checkboxes.appendChild(div);
                });
            };
            
            document.getElementById('cancelGroupForm').onclick = () => {
                document.getElementById('createGroupForm').classList.add('hidden');
                document.getElementById('showCreateGroup').classList.remove('hidden');
                document.getElementById('groupName').value = '';
                document.getElementById('groupDescription').value = '';
                document.querySelectorAll('#contactCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
                updateSelectedCount();
            };
            
            document.getElementById('createGroupForm').onsubmit = async function(e) {
                e.preventDefault();
                
                const groupName = document.getElementById('groupName').value.trim();
                const groupDescription = document.getElementById('groupDescription').value.trim();
                const selectedMembers = Array.from(document.querySelectorAll('#contactCheckboxes input[type="checkbox"]:checked')).map(cb => cb.value);
                
                if (!groupName) {
                    await showPopup('Erreur', 'Veuillez entrer un nom pour le groupe', 'error');
                    return;
                }
                
                if (selectedMembers.length < 2) {
                    await showPopup('Erreur', 'Veuillez sélectionner au moins 2 membres', 'error');
                    return;
                }
                
                const newGroup = {
                    id: Date.now().toString(),
                    nom: groupName,
                    description: groupDescription,
                    membres: selectedMembers,
                    admin: selectedMembers[0]
                };
                
                groups.push(newGroup);
                saveToStorage();
                
                document.getElementById('createGroupForm').classList.add('hidden');
                document.getElementById('showCreateGroup').classList.remove('hidden');
                document.getElementById('groupName').value = '';
                document.getElementById('groupDescription').value = '';
                document.querySelectorAll('#contactCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
                
                await showPopup('Succès', 'Groupe créé avec succès', 'success');
                renderGroups();
            };
            
            // Création de diffusion
            document.getElementById('showCreateDiffusion').onclick = async () => {
                if (contacts.length === 0) {
                    await showPopup('Erreur', 'Vous devez avoir au moins 1 contact pour créer une diffusion', 'error');
                    return;
                }
                
                document.getElementById('showCreateDiffusion').classList.add('hidden');
                document.getElementById('createDiffusionForm').classList.remove('hidden');
                
                // Remplir les checkboxes
                const checkboxes = document.getElementById('diffusionContactCheckboxes');
                checkboxes.innerHTML = '';
                
                contacts.forEach(contact => {
                    const div = document.createElement('div');
                    div.className = 'flex items-center space-x-2';
                    div.innerHTML = `
                        <input type="checkbox" id="diffusion-member-${contact.id}" value="${contact.name}" onchange="updateDiffusionSelectedCount()">
                        <label for="diffusion-member-${contact.id}" class="text-sm">${contact.name}</label>
                    `;
                    checkboxes.appendChild(div);
                });
            };
            
            document.getElementById('cancelDiffusionForm').onclick = () => {
                document.getElementById('createDiffusionForm').classList.add('hidden');
                document.getElementById('showCreateDiffusion').classList.remove('hidden');
                document.getElementById('diffusionName').value = '';
                document.querySelectorAll('#diffusionContactCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
                updateDiffusionSelectedCount();
            };
            
            document.getElementById('createDiffusionForm').onsubmit = async function(e) {
                e.preventDefault();
                
                const diffusionName = document.getElementById('diffusionName').value.trim();
                const selectedRecipients = Array.from(document.querySelectorAll('#diffusionContactCheckboxes input[type="checkbox"]:checked')).map(cb => cb.value);
                
                if (!diffusionName) {
                    await showPopup('Erreur', 'Veuillez entrer un nom pour la diffusion', 'error');
                    return;
                }
                
                if (selectedRecipients.length === 0) {
                    await showPopup('Erreur', 'Veuillez sélectionner au moins 1 destinataire', 'error');
                    return;
                }
                
                const newDiffusion = {
                    id: Date.now().toString(),
                    nom: diffusionName,
                    recipients: selectedRecipients
                };
                
                diffusions.push(newDiffusion);
                saveToStorage();
                
                document.getElementById('createDiffusionForm').classList.add('hidden');
                document.getElementById('showCreateDiffusion').classList.remove('hidden');
                document.getElementById('diffusionName').value = '';
                document.querySelectorAll('#diffusionContactCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
                
                await showPopup('Succès', 'Diffusion créée avec succès', 'success');
                renderDiffusions();
            };
            
            // Messages multi-contacts
            document.getElementById('sendMultiMessage').onclick = sendMultiMessage;
            document.getElementById('cancelMultiMessage').onclick = () => {
                document.getElementById('multiContactForm').classList.add('hidden');
            };
            
            // Chat
            document.getElementById('backBtn').onclick = hideChat;
            document.getElementById('sendBtn').onclick = sendMessage;
            document.getElementById('messageInput').onkeypress = function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            };
            
            // Appels
            document.getElementById('voiceCallBtn').onclick = startVoiceCall;
            document.getElementById('videoCallBtn').onclick = startVideoCall;
            document.getElementById('endCallBtn').onclick = endCall;
            document.getElementById('endVideoCallBtn').onclick = endCall;
            document.getElementById('muteCallBtn').onclick = () => toggleMute(false);
            document.getElementById('muteVideoCallBtn').onclick = () => toggleMute(true);
            document.getElementById('cameraBtn').onclick = toggleCamera;
            document.getElementById('speakerBtn').onclick = toggleSpeaker;
            
            // Sauvegarder les brouillons
            document.getElementById('messageInput').oninput = saveDraft;
            
            // Gestion des fichiers
            document.getElementById('imageBtn').onclick = () => document.getElementById('imageInput').click();
            document.getElementById('fileBtn').onclick = () => document.getElementById('fileInputHidden').click();
            
            // Gestion de l'audio
            document.getElementById('audioBtn').onmousedown = startRecording;
            document.getElementById('audioBtn').onmouseup = stopRecording;
            document.getElementById('audioBtn').onmouseleave = stopRecording;
            
            document.getElementById('imageInput').onchange = function(e) {
                const file = e.target.files[0];
                if (file) handleFileUpload(file, 'image');
            };
            
            document.getElementById('fileInputHidden').onchange = function(e) {
                const file = e.target.files[0];
                if (file) handleFileUpload(file, 'file');
            };
            
            document.getElementById('audioInput').onchange = function(e) {
                const file = e.target.files[0];
                if (file) handleFileUpload(file, 'audio');
            };
            
            // Modal de gestion des groupes
            document.getElementById('closeGroupModal').onclick = () => {
                document.getElementById('groupManageModal').classList.add('hidden');
            };
            
            // Actions du chat
            document.getElementById('archiveChatBtn').onclick = () => {
                if (selectedContact) {
                    archiveContact(selectedContact.id);
                    hideChat();
                }
            };
            
            document.getElementById('deleteBtn').onclick = () => {
                if (selectedContact) {
                    deleteContact(selectedContact.id);
                    hideChat();
                } else if (selectedGroup) {
                    deleteGroup(selectedGroup.id);
                    hideChat();
                } else if (selectedDiffusion) {
                    deleteDiffusion(selectedDiffusion.id);
                    hideChat();
                }
            };
            
            // Fermer les menus en cliquant ailleurs
            document.onclick = function(e) {
                if (!e.target.closest('.options-toggle') && !e.target.closest('.options-menu')) {
                    document.querySelectorAll('.options-menu').forEach(menu => {
                        menu.classList.add('hidden');
                    });
                }
            };
        });

        function updateSelectedCount() {
            const selectedCount = document.querySelectorAll('#contactCheckboxes input[type="checkbox"]:checked').length;
            document.getElementById('selectedCount').textContent = `${selectedCount} membre(s) sélectionné(s)`;
        }

        function updateDiffusionSelectedCount() {
            const selectedCount = document.querySelectorAll('#diffusionContactCheckboxes input[type="checkbox"]:checked').length;
            document.getElementById('diffusionSelectedCount').textContent = `${selectedCount} destinataire(s) sélectionné(s)`;
        }