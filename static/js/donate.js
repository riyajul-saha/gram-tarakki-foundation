(function () {
    // Scroll reveal
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
    reveals.forEach(el => observer.observe(el));

    // Donation card selection toggle
    const donationCards = document.querySelectorAll('.donation-card');
    donationCards.forEach(card => {
        const btn = card.querySelector('.card-btn');
        if (btn) {
            btn.addEventListener('click', function () {
                // Remove selected class from all cards and their buttons
                donationCards.forEach(c => {
                    c.classList.remove('selected');
                    const b = c.querySelector('.card-btn');
                    if (b) {
                        b.classList.remove('selected');
                        b.textContent = 'Select';
                    }
                });

                // Add selected class to this card and button
                card.classList.add('selected');
                this.classList.add('selected');
                this.textContent = 'Selected';
            });
        }
    });

    // Amount pill active toggle
    const pills = document.querySelectorAll('.amount-pill');
    const customInput = document.getElementById('customAmount');

    pills.forEach(pill => {
        pill.addEventListener('click', function () {
            pills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            // clear custom input if needed
            if (customInput) customInput.value = '';
        });
    });

    // Optional: if custom input gets focus, remove active from pills
    if (customInput) {
        customInput.addEventListener('focus', () => {
            pills.forEach(p => p.classList.remove('active'));
        });
    }

    // Sticky donate button smooth scroll
    document.querySelector('.sticky-donate').addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector('#donation-options').scrollIntoView({ behavior: 'smooth' });
    });

    // General Smooth scrolling for anchor links (from home.js)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Skip if it's the sticky button as it has its own handler (though the logic is similar)
            if (this.classList.contains('sticky-donate')) return;

            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Account for fixed header if necessary, or just scroll to element
                const headerOffset = 80; // approximate header height
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // --- Donation Logic ---
    const getDonationAmount = () => {
        let amt = 0;
        const activePill = document.querySelector('.amount-pill.active');
        if (activePill) amt = parseInt(activePill.getAttribute('data-amount'));
        const customAmt = document.getElementById('customAmount')?.value;
        if (customAmt && parseInt(customAmt) > 0) amt = parseInt(customAmt);
        return amt;
    };

    const validateForm = () => {
        const name = document.getElementById('donorName').value.trim();
        const email = document.getElementById('donorEmail').value.trim();
        const phone = document.getElementById('donorPhone').value.trim();
        const amt = getDonationAmount();
        
        if (!name || !email || !phone) {
            alert('Please fill all required fields (Name, Email, Phone).');
            return false;
        }
        if (amt <= 0) {
            alert('Please select or enter a valid donation amount.');
            return false;
        }
        return {
            fullname: name,
            email: email,
            phone: phone,
            city: document.getElementById('donorCity').value.trim(),
            pan: document.getElementById('donorPan').value.trim(),
            message: document.getElementById('donorMessage').value.trim(),
            amount: amt
        };
    };

    let currentDonationId = null;

    const initiateDonation = async (paymentMethod, formData) => {
        try {
            const res = await fetch('/api/donate/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.assign({}, formData, { paymentMethod }))
            });
            const data = await res.json();
            if (data.status === 'success') {
                currentDonationId = data.donation_id;
                return true;
            } else {
                alert(data.message || 'Error initiating donation.');
                return false;
            }
        } catch (e) {
            console.error(e);
            alert('Network error while connecting to server.');
            return false;
        }
    };

    const verifyDonation = async (txnId, status) => {
        try {
            await fetch('/api/donate/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    donation_id: currentDonationId, 
                    status: status, 
                    transaction_id: txnId 
                })
            });
        } catch (e) {
            console.error(e);
        }
    };

    // Modal elements
    const overlay = document.getElementById('paymentModalOverlay');
    const upiModal = document.getElementById('upiModal');
    const cardModal = document.getElementById('cardModal');
    
    // Close modals
    document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            overlay.classList.remove('active');
            upiModal.classList.remove('active');
            cardModal.classList.remove('active');
        });
    });

    // Handle Payment Button Clicks
    const payUpi = document.getElementById('payUpi');
    const payCard = document.getElementById('payCard');

    if (payUpi) {
        payUpi.addEventListener('click', async () => {
            const data = validateForm();
            if(!data) return;
            const success = await initiateDonation('UPI', data);
            if(success) {
                overlay.classList.add('active');
                upiModal.classList.add('active');
                
                document.querySelector('#upiModal .modal-body').style.display = 'block';
                document.getElementById('upiProcessing').style.display = 'none';
                document.getElementById('upiResult').style.display = 'none';
            }
        });
    }

    if (payCard) {
        payCard.addEventListener('click', async () => {
            const data = validateForm();
            if(!data) return;
            const success = await initiateDonation('Card', data);
            if(success) {
                overlay.classList.add('active');
                cardModal.classList.add('active');
                
                document.getElementById('cardFormBody').style.display = 'block';
                document.getElementById('cardProcessing').style.display = 'none';
                document.getElementById('cardResult').style.display = 'none';
            }
        });
    }

    // UPI Tabs Logic
    const upiTabs = document.querySelectorAll('.upi-tab');
    upiTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            upiTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.upi-section').forEach(s => s.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.add('active');
        });
    });

    // Helper for timer
    const startTimer = (durationMinutes, displayElem, onComplete) => {
        let timer = durationMinutes * 60;
        let pId = setInterval(() => {
            let minutes = parseInt(timer / 60, 10);
            let seconds = parseInt(timer % 60, 10);
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
            displayElem.textContent = minutes + ":" + seconds;
            if (--timer < 0) {
                clearInterval(pId);
                onComplete();
            }
        }, 1000);
        return pId;
    };

    const processUpiPayment = () => {
        document.querySelector('#upiModal .modal-body').style.display = 'none';
        const processing = document.getElementById('upiProcessing');
        processing.style.display = 'block';
        
        // Wait 5 minutes as requested
        startTimer(5, document.getElementById('upiTimer'), () => {
            const txnId = 'TXN' + Math.floor(Math.random() * 10000000000);
            verifyDonation(txnId, 'done');
            processing.style.display = 'none';
            const resultBox = document.getElementById('upiResult');
            resultBox.style.display = 'block';
            document.getElementById('upiTxnRef').textContent = txnId;
        });
    };

    document.getElementById('qrPaidBtn')?.addEventListener('click', processUpiPayment);
    document.getElementById('upiIdPayBtn')?.addEventListener('click', () => {
        const uId = document.getElementById('upiIdInput').value.trim();
        if(!uId) return alert('Enter valid UPI ID');
        processUpiPayment();
    });

    // Card Payment Process
    document.getElementById('cardPayBtn')?.addEventListener('click', () => {
        const cNum = document.getElementById('cardNumber').value.trim();
        const cExp = document.getElementById('cardExpiry').value.trim();
        const cCvv = document.getElementById('cardCvv').value.trim();
        const cName = document.getElementById('cardName').value.trim();
        
        if(!cNum || !cExp || !cCvv || !cName) {
            return alert('Please fill all card details.');
        }

        document.getElementById('cardFormBody').style.display = 'none';
        const cProcessing = document.getElementById('cardProcessing');
        cProcessing.style.display = 'block';

        setTimeout(() => {
            const txnId = 'RZP_' + Math.floor(Math.random() * 10000000000);
            verifyDonation(txnId, 'done');
            cProcessing.style.display = 'none';
            document.getElementById('cardResult').style.display = 'block';
            document.getElementById('cardTxnRef').textContent = txnId;
        }, 5000);
    });

})();