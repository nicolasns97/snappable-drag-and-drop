const ns ="http://www.w3.org/2000/svg";
const svg = document.getElementById("svg");
const axisLength = 7;
const cellSize = 50;
const grid = axisLength * axisLength;
const X_AXIS_STARTING_POSITION = 50;
const X_AXIS_ENDING_POSITION = X_AXIS_STARTING_POSITION + (axisLength * cellSize);
const Y_AXIS_STARTING_POSITION = 150;
const Y_AXIS_ENDING_POSITION = Y_AXIS_STARTING_POSITION + (axisLength * cellSize);
let selectedElement, offset, transform;

const createSvgLineElement = ({x1, x2, y1, y2, classList = []}) => {

    const svgLineElement = document.createElementNS(ns, "line");
    svgLineElement.setAttribute("x1", x1.toString());
    svgLineElement.setAttribute("x2", x2.toString());
    svgLineElement.setAttribute("y1", y1.toString());
    svgLineElement.setAttribute("y2", y2.toString());
    svgLineElement.classList.add(...classList);
    return svgLineElement;
}

const createSvgTextElement = ({x, y, dx = 0, dy = 0, value}) => {

    const svgTextElement = document.createElementNS(ns, "text");
    svgTextElement.setAttribute("x", x.toString());
    svgTextElement.setAttribute("y", y.toString());
    svgTextElement.setAttribute("dx", dx.toString());
    svgTextElement.setAttribute("dy", dy.toString());
    svgTextElement.innerHTML = value.toString();
    return svgTextElement;
}

const createAxisX = (parentNode) => {

    const axisX = createSvgLineElement({
        x1: X_AXIS_STARTING_POSITION,
        x2: X_AXIS_ENDING_POSITION,
        y1: Y_AXIS_ENDING_POSITION,
        y2: Y_AXIS_ENDING_POSITION,
        classList: ["axisLine"]
    });
    parentNode.appendChild(axisX);

    const polygonX = document.createElementNS(ns, "polygon");
    polygonX.setAttribute("points", `${X_AXIS_ENDING_POSITION + 10},${Y_AXIS_ENDING_POSITION} ${X_AXIS_ENDING_POSITION},${Y_AXIS_ENDING_POSITION + 10} ${X_AXIS_ENDING_POSITION},${Y_AXIS_ENDING_POSITION - 10}`)
    parentNode.appendChild(polygonX);
};

const createAxisY = (parentNode) => {

    const axisY = createSvgLineElement({
        x1: X_AXIS_STARTING_POSITION,
        x2: X_AXIS_STARTING_POSITION,
        y1: Y_AXIS_STARTING_POSITION,
        y2: Y_AXIS_ENDING_POSITION,
        classList: ["axisLine"]
    });
    parentNode.appendChild(axisY);
    const polygonY = document.createElementNS(ns, "polygon");

    polygonY.setAttribute("points", `${X_AXIS_STARTING_POSITION - 10},${Y_AXIS_STARTING_POSITION} ${X_AXIS_STARTING_POSITION},${Y_AXIS_STARTING_POSITION - 10} ${X_AXIS_STARTING_POSITION + 10},${Y_AXIS_STARTING_POSITION}`)
    parentNode.appendChild(polygonY);
};
const createAxisXLabel = (parentNode, i) => {

    parentNode.appendChild(createSvgTextElement({
        x: X_AXIS_STARTING_POSITION + (i * cellSize),
        y: Y_AXIS_ENDING_POSITION + 30,
        dx: -4,
        value: i
    }))
};
const createAxisYLabel = (parentNode, i) => {

    parentNode.appendChild(createSvgTextElement({
        x: X_AXIS_STARTING_POSITION - 30,
        y: Y_AXIS_STARTING_POSITION + (i * cellSize),
        dy: 4,
        value: Math.abs(i - 7)
    }))
};
function createAxisYLine(parentNode, i) {

    parentNode.appendChild(createSvgLineElement({
        x1: X_AXIS_STARTING_POSITION + ((i + 1) * cellSize),
        x2: X_AXIS_STARTING_POSITION + ((i + 1) * cellSize),
        y1: Y_AXIS_STARTING_POSITION,
        y2: Y_AXIS_ENDING_POSITION,
        classList: ["line"]
    }));
}
function createAxisXLine(parentNode, i) {

    parentNode.appendChild(createSvgLineElement({
        x1: X_AXIS_STARTING_POSITION,
        x2: X_AXIS_ENDING_POSITION,
        y1: Y_AXIS_STARTING_POSITION + (i * cellSize),
        y2: Y_AXIS_STARTING_POSITION + (i * cellSize),
        classList: ["line"]
    }));
}
const createGrid = (parentNode) => {

    for (let i = 0; i <= axisLength; i++) {
        if (i < axisLength) {
            createAxisXLine(parentNode, i);
            createAxisYLine(parentNode, i);
        }
        createAxisXLabel(parentNode, i);
        createAxisYLabel(parentNode, i);
    }
};

const getMousePosition = evt => {

    const CTM = svg.getScreenCTM();
    return {
        x: (evt.clientX - CTM.e) / CTM.a,
        y: (evt.clientY - CTM.f) / CTM.d
    };
};
const startDrag = evt => {

    if (evt.target.classList.contains('draggable')) {
        selectedElement = evt.target;
        offset = getMousePosition(evt);
        // Get all the transforms currently on this element
        const transforms = selectedElement.transform.baseVal;
        // Ensure the first transform is a translate transform
        if (transforms.length === 0 ||
            transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
            // Create a transform that translates by (0, 0)
            const translate = svg.createSVGTransform();
            translate.setTranslate(0, 0);
            // Add the translation to the front of the transforms list
            selectedElement.transform.baseVal.insertItemBefore(translate, 0);
        }
        // Get initial translation amount
        transform = transforms.getItem(0);
        offset.x -= transform.matrix.e;
        offset.y -= transform.matrix.f;
        svg.classList.add('dragging');

        selectedElement.classList.add('dragging');
    }
};

const drag = evt => {

    evt.preventDefault();
    if (selectedElement) {
        selectedElement.classList.add("ease");
        const mouse = getMousePosition(evt);
        if (isMouseWithinGridBounds(mouse)) {
            const {snappedX, snappedY} = snap(mouse);
            validate(snappedX, snappedY);
        } else {
            selectedElement.classList.remove("ease");
            selectedElement.setAttribute("r", 7);
            transform.setTranslate(mouse.x - offset.x, mouse.y - offset.y);
        }
    }
};
const snap = mouse => {

    const snappedX = getSnappedPosition(mouse.x - offset.x);
    const snappedY = getSnappedPosition(mouse.y - offset.y);
    transform.setTranslate(snappedX, snappedY);
    return {snappedX, snappedY};
};
const roundToNearestCell = x => Math.round(x / cellSize) * cellSize

const isMouseWithinGridBounds = mouse => mouse.x >= X_AXIS_STARTING_POSITION && mouse.x <= X_AXIS_ENDING_POSITION && mouse.y >= Y_AXIS_STARTING_POSITION && mouse.y <= Y_AXIS_ENDING_POSITION;

const getSnappedPosition = position => roundToNearestCell(Math.round(position / grid) * grid);

const validate = (snappedX, snappedY) => {

    const posX = Math.round((snappedX + roundToNearestCell(offset.x)) / grid) - 1
    const posY = Math.abs(Math.round((snappedY + roundToNearestCell(offset.y) - 100) / grid - 1 - 7))
    if (posX == selectedElement.dataset.spX && posY == selectedElement.dataset.spY) {
        console.log("OK")
        selectedElement.setAttribute("r", 10)
    } else {
        console.log("KO")
        selectedElement.setAttribute("r", 7)
    }
};
const endDrag = () => {

    svg.classList.remove('dragging')
    selectedElement && selectedElement.classList.remove('dragging')
    selectedElement = null;
};

window.onload = () => {
    const svg = document.getElementById("svg");
    svg.addEventListener("mouseleave", endDrag);
    svg.addEventListener("mousemove", drag);
    svg.addEventListener("mouseup", endDrag);

    document.querySelectorAll("svg circle").forEach(el => {el.addEventListener("mousedown", startDrag)});

    const plot = document.createElementNS(ns, "g");
    plot.classList.add("plot")
    svg.appendChild(plot);

    createAxisX(plot);
    createAxisY(plot);
    createGrid(plot);
}
