//simplify, improve mobile support later

const playground = document.getElementById('playground');
const physicalBodyAttributes = {
    restitution: 0.5,
    frictionAir: 0.015,
    friction: 0.9,
    frictionStatic: 0.2,
    density: 0.016,
    render: {
        fillStyle: "transparent",
        strokeStyle: "transparent"
    }
}

function makeStarVertices(radius, innerRadius, points = 5) {
    const vertices = [];
    const angleStep = Math.PI / points;

    for (let i = 0; i < points * 2; i++) {
        const angle = -Math.PI / 2 + i * angleStep;
        const r = i % 2 === 0 ? radius : innerRadius;
        vertices.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }

    return Matter.Vertices.clockwiseSort(vertices);
}

function makeStarClipPath(outerRadius, innerRadius, points = 5) {
    const vertices = makeStarVertices(outerRadius, innerRadius, points);
    const path = vertices.map(({ x, y }) => {
        const px = ((x + outerRadius) / (outerRadius * 2)) * 100;
        const py = ((y + outerRadius) / (outerRadius * 2)) * 100;
        return `${px}% ${py}%`;
    });
    return `polygon(${path.join(', ')})`;
}

class PhysicalSystem {
    constructor(element) {
        //primary setup
        this.playground = element;
        this.engine = Matter.Engine.create() // create the engine
        this.runner = Matter.Runner.create() // create the runner
        this.render = Matter.Render.create({ // create the render
            element: this.playground,
            engine: this.engine,
            options: {
                width: this.playground.clientWidth || window.innerWidth,
                height: this.playground.clientHeight || window.innerHeight,
                wireframes: false,
                background: 'transparent'
            }
        })

        //secondary setup
        this.objects = []
        this.updateFunctions = [];

        const w = this.render.options.width;
        const h = this.render.options.height;
        this.borders = [
            Matter.Bodies.rectangle(
                w / 2,
                h + 50,
                w,
                100,
                { isStatic: true, restitution: 1, friction: 1, frictionStatic: 1 }
            ),
            Matter.Bodies.rectangle(
                w + 50,
                h / 2,
                100,
                h * 1000,
                { isStatic: true, restitution: 1, friction: 1, frictionStatic: 1 }
            ),
            Matter.Bodies.rectangle(
                -50,
                h / 2,
                100,
                h * 1000,
                { isStatic: true, restitution: 1, friction: 1, frictionStatic: 1 }
            )
        ];
        Matter.World.add(this.engine.world, this.borders);

        Matter.Events.on(this.engine, 'beforeUpdate', () => {
            for (let i = 0; i < this.updateFunctions.length; i++) {
                this.updateFunctions[i]();
            }
        });

        window.addEventListener('resize', () => this.updateBounds());
        window.addEventListener('scroll', () => this.updateBounds());
    }

    updateBounds() {
        const rect = this.playground.getBoundingClientRect();
        const width = rect.width || window.innerWidth;
        const height = rect.height || window.innerHeight;

        this.render.canvas.width = width;
        this.render.canvas.height = height;
        this.render.options.width = width;
        this.render.options.height = height;

        Matter.Body.setPosition(this.borders[0], { x: width / 2, y: height + 50 });
        Matter.Body.setPosition(this.borders[1], { x: width + 50, y: height / 2 });
        Matter.Body.setPosition(this.borders[2], { x: -50, y: height / 2 });
    }

    run() {
        Matter.Render.run(this.render);
        Matter.Runner.run(this.runner, this.engine);
    }
}

class PhysicalBody {
    constructor(system, element, data = {}) {
        this.system = system;
        this.element = element;

        const rect = element.getBoundingClientRect();
        let width = rect.width;
        let height = rect.height;

        const dataset = element.dataset || {};
        const shape = data.shape || dataset.shape || 'rectangle';
        const position = data.position || {
            x: dataset.x !== undefined ? Number(dataset.x) : undefined,
            y: dataset.y !== undefined ? Number(dataset.y) : undefined
        };
        const startX = position?.x ?? (this.system.render.options.width / 2 + (Math.random() - 0.5) * this.system.render.options.width / 2);
        const startY = position?.y ?? - (Math.random() * 1000 + 40);

        if (shape === 'circle' || shape === 'ball') {
            const radius = data.radius || (dataset.radius ? Number(dataset.radius) : Math.min(width, height) / 2);
            width = height = radius * 2;
            this.body = Matter.Bodies.circle(startX, startY, radius, physicalBodyAttributes);
            this.element.style.borderRadius = '50%';
        } else if (shape === 'star') {
            const outerRadius = data.radius || (dataset.radius ? Number(dataset.radius) : Math.min(width, height) / 2);
            const innerRadius = data.innerRadius || (dataset.innerRadius ? Number(dataset.innerRadius) : outerRadius * 0.45);
            const points = data.points || (dataset.points ? Number(dataset.points) : 5);
            const vertices = makeStarVertices(outerRadius, innerRadius, points);
            width = height = outerRadius * 2;
            this.body = Matter.Bodies.fromVertices(startX, startY, [vertices], physicalBodyAttributes, true);
            const clipPath = makeStarClipPath(outerRadius, innerRadius, points);
            this.element.style.clipPath = clipPath;
            this.element.style.webkitClipPath = clipPath;
        } else {
            this.body = Matter.Bodies.rectangle(startX, startY, width, height, physicalBodyAttributes);
        }

        this.size = [width, height];
        this.element.style.height = `${height}px`;
        this.element.style.width = `${width}px`;

        Matter.World.add(this.system.engine.world, this.body);
        Matter.Body.setAngularVelocity(this.body, (Math.random() - 0.5) / 0.05 * 0.001);
        Matter.Body.setVelocity(this.body, { x: (Math.random() - 0.5) * 50, y: (Math.random() - 0.5) * 10 });
        this.system.updateFunctions.push(() => this.update());
        this.system.objects.push(this);
    }

    update() {
        if (this.element && this.size) {
            this.element.style.transform = `translate(${this.body.position.x - this.size[0] / 2}px, ${this.body.position.y - this.size[1] / 2}px) rotate(${this.body.angle * 180 / Math.PI}deg)`;
        } else {
            console.warn("No DOM element found, cannot update!");
        };
    }
}

const ps = new PhysicalSystem(playground)
// Convert HTMLCollection to array and create physics body for each element
const physicalElements = Array.from(document.getElementsByClassName('physical'));
physicalElements.forEach(element => {
    const data = {
        shape: element.dataset.shape,
        radius: element.dataset.radius ? Number(element.dataset.radius) : undefined,
        innerRadius: element.dataset.innerRadius ? Number(element.dataset.innerRadius) : undefined,
        points: element.dataset.points ? Number(element.dataset.points) : undefined,
        position: (element.dataset.x !== undefined || element.dataset.y !== undefined) ? {
            x: element.dataset.x !== undefined ? Number(element.dataset.x) : undefined,
            y: element.dataset.y !== undefined ? Number(element.dataset.y) : undefined
        } : undefined
    };

    new PhysicalBody(ps, element, data);
});

ps.run();

// const clock = document.getElementById('time');

// function updateClock() {
//     const now = new Date();

//     clock.textContent = now.toLocaleTimeString();
// }

// updateClock(); // run immediately
// setInterval(updateClock, 1000);
