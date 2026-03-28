// Navbar scrolling effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
const mobileToggle = document.getElementById('mobile-toggle');
const navLinks = document.getElementById('nav-links');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        // Animate hamburger
        const spans = mobileToggle.querySelectorAll('span');
        if (navLinks.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
}

// Background Data Stream Animation
const canvas = document.getElementById('bg-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    
    let packets = [];
    let nodes = [];
    let paths = [];
    let time = 0;
    
    let mouseX = 0;
    let mouseY = 0;
    
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    const colors = [
        'rgba(45, 212, 191, 0.8)', // teal
        'rgba(34, 211, 238, 0.8)', // cyan
        'rgba(59, 130, 246, 0.8)', // blue
        'rgba(168, 85, 247, 0.8)'  // purple
    ];

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initializeTopology();
    };

    const initializeTopology = () => {
        nodes = [];
        paths = [];
        packets = [];

        const w = canvas.width;
        const h = canvas.height;
        const centerY = h / 2;
        
        // Define tiers for X positions
        const t1 = w * 0.15; // Sources
        const t2 = w * 0.40; // Message Bus
        const t3 = w * 0.65; // Stream Processing
        const t4 = w * 0.85; // Sinks

        // 1. Sources (Producers)
        nodes.push(
            { id: 'src1', x: t1, y: centerY - 180, type: 'source', label: 'IoT Sensors', color: colors[0] },
            { id: 'src2', x: t1, y: centerY, type: 'source', label: 'API Gateway', color: colors[1] },
            { id: 'src3', x: t1, y: centerY + 180, type: 'source', label: 'Database CDC', color: colors[0] }
        );

        // 2. Message Bus (Broker)
        nodes.push(
            { id: 'bus1', x: t2, y: centerY - 90, type: 'broker', label: 'Apache Kafka', color: colors[2] },
            { id: 'bus2', x: t2, y: centerY + 90, type: 'broker', label: 'AWS MSK', color: colors[2] }
        );
        
        // 3. Stream Processing
        nodes.push(
            { id: 'proc1', x: t3, y: centerY - 90, type: 'processor', label: 'Spark Streaming', color: colors[3] },
            { id: 'proc2', x: t3, y: centerY + 90, type: 'processor', label: 'Flink Engine', color: colors[3] }
        );

        // 4. Sinks (Consumers)
        nodes.push(
            { id: 'sink1', x: t4, y: centerY - 180, type: 'sink', label: 'S3 Data Lake', color: colors[1] },
            { id: 'sink2', x: t4, y: centerY, type: 'sink', label: 'Elasticsearch', color: colors[0] },
            { id: 'sink3', x: t4, y: centerY + 180, type: 'sink', label: 'PostgreSQL DB', color: colors[3] }
        );

        // Define paths (edges)
        nodes.filter(n => n.type === 'source').forEach(src => {
            nodes.filter(n => n.type === 'broker').forEach(bus => {
                paths.push({ start: src, end: bus, cp: { x: (src.x + bus.x) / 2, y: src.y } });
            });
        });
        
        nodes.filter(n => n.type === 'broker').forEach(bus => {
            nodes.filter(n => n.type === 'processor').forEach(proc => {
                paths.push({ start: bus, end: proc, cp: { x: (bus.x + proc.x) / 2, y: bus.y } });
            });
        });
        
        nodes.filter(n => n.type === 'processor').forEach(proc => {
            nodes.filter(n => n.type === 'sink').forEach(sink => {
                paths.push({ start: proc, end: sink, cp: { x: (proc.x + sink.x) / 2, y: proc.y } });
            });
        });
    };

    const getBezierPoint = (t, p0, p1, p2) => {
        const x = Math.pow(1-t, 2) * p0.x + 2 * (1-t) * t * p1.x + Math.pow(t, 2) * p2.x;
        const y = Math.pow(1-t, 2) * p0.y + 2 * (1-t) * t * p1.y + Math.pow(t, 2) * p2.y;
        return {x, y};
    };

    const createPacket = () => {
        if (paths.length === 0) return;
        const firstLayerPaths = paths.filter(p => p.start.type === 'source');
        const path = firstLayerPaths[Math.floor(Math.random() * firstLayerPaths.length)];
        
        packets.push({
            path: path,
            t: 0,
            speed: 0.003 + Math.random() * 0.004,
            size: 2.5 + Math.random() * 2,
            type: 'data'
        });
    };

    const transferPacket = (oldPacket) => {
        const nextPaths = paths.filter(p => p.start.id === oldPacket.path.end.id);
        if (nextPaths.length === 0) return;
        
        const path = nextPaths[Math.floor(Math.random() * nextPaths.length)];
        packets.push({
            path: path,
            t: 0,
            speed: oldPacket.speed,
            size: oldPacket.size,
            type: oldPacket.type
        });
    }

    const drawNode = (node) => {
        // Base coordinate with slight gentle hover over time
        const floatingY = node.y + Math.sin(time * 0.02 + node.x) * 10;
        
        // Draw connection lines from mouse if hovering nearby
        const distToMouse = Math.sqrt((mouseX - node.x)**2 + (mouseY - floatingY)**2);
        let hoverScale = 1;
        if (distToMouse < 180) {
            hoverScale = 1 + (180 - distToMouse) / 360;
        }

        ctx.shadowBlur = 15;
        ctx.shadowColor = node.color;
        
        ctx.fillStyle = node.color.replace('0.8)', '0.15)');
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        const s = 22 * hoverScale;
        
        if (node.type === 'broker') {
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const hx = node.x + s * Math.cos(angle);
                const hy = floatingY + s * Math.sin(angle);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
        } else if (node.type === 'sink') {
            ctx.ellipse(node.x, floatingY - s/2, s, s/3, 0, 0, Math.PI * 2);
            ctx.moveTo(node.x - s, floatingY - s/2);
            ctx.lineTo(node.x - s, floatingY + s/2);
            ctx.ellipse(node.x, floatingY + s/2, s, s/3, 0, 0, Math.PI);
            ctx.lineTo(node.x + s, floatingY - s/2);
        } else if (node.type === 'processor') {
            ctx.moveTo(node.x, floatingY - s);
            ctx.lineTo(node.x + s, floatingY);
            ctx.lineTo(node.x, floatingY + s);
            ctx.lineTo(node.x - s, floatingY);
            ctx.closePath();
        } else {
            ctx.arc(node.x, floatingY, s, 0, Math.PI * 2);
        }
        
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        
        ctx.font = `600 ${12 * hoverScale}px 'Inter', sans-serif`;
        ctx.fillStyle = '#f3f4f6';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, floatingY + s * 1.5 + 10);
        
        ctx.font = `400 ${9 * hoverScale}px 'Inter', sans-serif`;
        ctx.fillStyle = node.color.replace('0.8)', '1)');
        ctx.fillText(node.type.toUpperCase(), node.x, floatingY + s * 1.5 + 24);
    };

    const drawPath = (path) => {
        const startY = path.start.y + Math.sin(time * 0.02 + path.start.x) * 10;
        const endY = path.end.y + Math.sin(time * 0.02 + path.end.x) * 10;
        const cpY = path.cp.y + Math.sin(time * 0.02 + path.cp.x) * 10;

        ctx.beginPath();
        ctx.moveTo(path.start.x, startY);
        ctx.quadraticCurveTo(path.cp.x, cpY, path.end.x, endY);
        
        const gradient = ctx.createLinearGradient(path.start.x, startY, path.end.x, endY);
        gradient.addColorStop(0, path.start.color.replace('0.8)', '0.05)'));
        gradient.addColorStop(0.5, path.start.color.replace('0.8)', '0.15)'));
        gradient.addColorStop(1, path.end.color.replace('0.8)', '0.05)'));
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.setLineDash([4, 15]);
        ctx.lineDashOffset = -time * 0.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();
        ctx.setLineDash([]);
    };

    const drawPacket = (packet) => {
        const startY = packet.path.start.y + Math.sin(time * 0.02 + packet.path.start.x) * 10;
        const endY = packet.path.end.y + Math.sin(time * 0.02 + packet.path.end.x) * 10;
        const cpY = packet.path.cp.y + Math.sin(time * 0.02 + packet.path.cp.x) * 10;
        
        packet.t += packet.speed;

        const pos = getBezierPoint(
            packet.t, 
            {x: packet.path.start.x, y: startY}, 
            {x: packet.path.cp.x, y: cpY}, 
            {x: packet.path.end.x, y: endY}
        );

        ctx.shadowBlur = 15;
        ctx.shadowColor = packet.path.end.color;
        
        ctx.fillStyle = packet.path.end.color.replace('0.8)', '1)');
        
        if (packet.t % 0.1 > 0.05 && packet.size > 3.5) {
            ctx.font = `${packet.size * 3}px monospace`;
            ctx.fillText(Math.random() > 0.5 ? '1' : '0', pos.x, pos.y + packet.size);
        } else {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, packet.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
    };

    const animate = () => {
        time++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        paths.forEach(drawPath);
        
        for (let i = packets.length - 1; i >= 0; i--) {
            const packet = packets[i];
            drawPacket(packet);
            
            if (packet.t >= 1) {
                transferPacket(packet);
                packets.splice(i, 1);
            }
        }
        
        nodes.forEach(drawNode);

        if (Math.random() < 0.25) createPacket();
        
        requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
}

// Contact form handling
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const formStatus = document.getElementById('formStatus');
        
        submitBtn.disabled = true;
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        formStatus.textContent = '';
        
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        // Replace 'YOUR_FORM_ID' below with your actual Formspree ID
        // Example: https://formspree.io/f/xabcdefg
        fetch('https://formspree.io/f/mykbkqaz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (response.ok) {
                formStatus.textContent = 'Message sent successfully!';
                formStatus.style.color = '#10b981'; // Success color
                contactForm.reset();
            } else {
                return response.json().then(data => {
                    if (Object.hasOwn(data, 'errors')) {
                        throw new Error(data["errors"].map(error => error["message"]).join(", "));
                    } else {
                        throw new Error('Form submission failed');
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error submitting form:', error);
            formStatus.textContent = error.message !== 'Form submission failed' ? error.message : 'Oops! There was a problem submitting your form.';
            formStatus.style.color = '#ef4444'; // Error color
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        });
    });
}
