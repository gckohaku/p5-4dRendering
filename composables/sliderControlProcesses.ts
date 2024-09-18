import p5 from "p5";

export const createSliderContainer = (p: p5, id: string, displayText: string, { min = 0, max = 360, value = 0, step = 10 }: { min?: number, max?: number, value?: number, step?: number } = {}): p5.Element => {
	const containerDiv = p.createDiv();
	containerDiv.id(id);

	const heading = p.createP(displayText);

	const slider = p.createSlider(min, max, value, step);
	slider.addClass("slider");
	const buttonLeft = p.createButton("<");
	const buttonRight = p.createButton(">");

	containerDiv.child(heading);
	containerDiv.child(buttonLeft);
	containerDiv.child(slider);
	containerDiv.child(buttonRight);

	return containerDiv;
}