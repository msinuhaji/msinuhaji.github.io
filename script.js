//simplify, improve mobile support later

const engine = Matter.Engine.create();
const render = Matter.Render.create({
    element: document.getElementById('playground'),
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent'
    }
});
const runner = Matter.Runner.create();
let updateFunctions = [];

let borders = [Matter.Bodies.rectangle(
    window.innerWidth / 2, //x centre
    window.innerHeight + 50, //y centre
    window.innerWidth, //width
    100, //height
    { isStatic: true, restitution: 1, friction: 1, frictionStatic: 1 }
),
Matter.Bodies.rectangle(
    window.innerWidth + 50, //x centre
    window.innerHeight / 2, //y centre
    100, //width
    window.innerHeight * 1000, //height
    { isStatic: true, restitution: 1, friction: 1, frictionStatic: 1 }
),
Matter.Bodies.rectangle(
    -50, //x centre
    window.innerHeight / 2, //y centre
    100, //width
    window.innerHeight * 100, //height
    { isStatic: true, restitution: 1, friction: 1, frictionStatic: 1 }
)];
let objects = [];
Matter.World.add(engine.world, borders);

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

class ElementBody {
    constructor(element, data = {}) {
        const rect = element.getBoundingClientRect();
        let width = rect.width;
        let height = rect.height;

        const dataset = element.dataset || {};
        const shape = data.shape || dataset.shape || 'rectangle';
        const position = data.position || {
            x: dataset.x !== undefined ? Number(dataset.x) : undefined,
            y: dataset.y !== undefined ? Number(dataset.y) : undefined
        };
        const startX = position?.x ?? window.innerWidth / 2 + (Math.random() - 0.5) * window.innerWidth / 2;
        const startY = position?.y ?? - (Math.random() * 1000 + 40);

        this.element = element;

        if (shape === 'circle' || shape === 'ball') {
            const radius = data.radius || (dataset.radius ? Number(dataset.radius) : Math.min(width, height) / 2);
            width = height = radius * 2;
            this.body = Matter.Bodies.circle(startX, startY, radius, {
                restitution: 0.8,
                frictionAir: 0.005,
                friction: 0.8,
                frictionStatic: 0.2,
                density: 0.006,
                render: {
                    fillStyle: "transparent",
                    strokeStyle: "transparent"
                }
            });
            this.element.style.borderRadius = '50%';
        } else if (shape === 'star') {
            const outerRadius = data.radius || (dataset.radius ? Number(dataset.radius) : Math.min(width, height) / 2);
            const innerRadius = data.innerRadius || (dataset.innerRadius ? Number(dataset.innerRadius) : outerRadius * 0.45);
            const points = data.points || (dataset.points ? Number(dataset.points) : 5);
            const vertices = makeStarVertices(outerRadius, innerRadius, points);
            width = height = outerRadius * 2;
            this.body = Matter.Bodies.fromVertices(startX, startY, [vertices], {
                restitution: 0.5,
                frictionAir: 0.005,
                friction: 0.8,
                frictionStatic: 0.2,
                density: 0.016,
                render: {
                    fillStyle: "transparent",
                    strokeStyle: "transparent"
                }
            }, true);
            const clipPath = makeStarClipPath(outerRadius, innerRadius, points);
            this.element.style.clipPath = clipPath;
            this.element.style.webkitClipPath = clipPath;
        } else {
            this.body = Matter.Bodies.rectangle(startX, startY, width, height, {
                restitution: 0.3,
                frictionAir: 0.005,
                friction: 0.8,
                frictionStatic: 0.2,
                density: 0.006,
                render: {
                    fillStyle: "transparent",
                    strokeStyle: "transparent"
                }
            });
        }

        this.size = [width, height];
        this.element.style.height = `${height}px`;
        this.element.style.width = `${width}px`;

        Matter.World.add(engine.world, this.body);
        Matter.Body.setAngularVelocity(this.body, (Math.random() - 0.5) / 0.05 * 0.001);
        Matter.Body.setVelocity(this.body, { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 40 });
        updateFunctions.push(() => this.update());
    }

    update() {
        if (this.element && this.size) {
            this.element.style.transform = `translate(${this.body.position.x - this.size[0] / 2}px, ${this.body.position.y - this.size[1] / 2}px) rotate(${this.body.angle * 180 / Math.PI}deg)`;
        } else {
            console.warn("No DOM element found, cannot update!");
        };
    }
}

Matter.Render.run(render);
Matter.Runner.run(runner, engine);

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

    objects.push(new ElementBody(element, data));
});

Matter.Events.on(engine, 'beforeUpdate', () => {
    for (let i = 0; i < updateFunctions.length; i++) {
        updateFunctions[i]();
    }
});

// const clock = document.getElementById('time');

// function updateClock() {
//     const now = new Date();

//     clock.textContent = now.toLocaleTimeString();
// }

// updateClock(); // run immediately
// setInterval(updateClock, 1000);
