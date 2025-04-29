// @ts-nocheck
import { expect } from "chai";
import Sinon from "sinon";
import { Link } from "./Link";

describe('Link Component Tests', () => {
  beforeEach(() => {
    // Create a fresh DOM environment for each test
    document.body.innerHTML = '';
  });
  
  afterEach(() => {
    // Clean up all Sinon stubs, mocks, and fake timers
    Sinon.restore();
  });
  
  it('should render with correct text and href', () => {
    const linkText = 'Test Link';
    const linkHref = '/test';
    const link = new Link({ 
      text: linkText, 
      href: linkHref,
      onClick: () => {}
    });
    
    // Append to DOM to ensure rendering completes
    document.body.appendChild(link.getContent());
    
    const element = link.element;
    
    expect(element.textContent).to.equal(linkText);
    expect(element.getAttribute('href')).to.equal(linkHref);
  });
  
  it('should have the correct CSS class', () => {
    const link = new Link({
      text: 'Test Link',
      href: '/test',
      onClick: () => {}
    });
    
    // Append to DOM to ensure rendering completes
    document.body.appendChild(link.getContent());
    
    expect(link.element.className).to.include('footer-link');
  });
  
  it('should handle click events and call the onClick handler', () => {
    // Create a spy for the onClick handler
    const onClickSpy = Sinon.spy();
    
    // Create the link component with our spy
    const link = new Link({
      text: 'Test Link',
      href: '/test',
      onClick: onClickSpy
    });
    
    // Append to DOM to ensure rendering completes
    document.body.appendChild(link.getContent());
    
    // Create a spy on the changeStyles method
    const changeStylesSpy = Sinon.spy(link, 'changeStyles');
    
    // Simulate a click event
    const event = new MouseEvent('click');
    link.element.dispatchEvent(event);
    
    // Verify both handlers were called
    expect(onClickSpy.calledOnce).to.be.true;
    expect(changeStylesSpy.calledOnce).to.be.true;
  });
  
  it('should update styles when clicked', () => {
    // Create a stub for the onClick handler
    const onClickStub = Sinon.stub();
    
    const link = new Link({
      text: 'Test Link',
      href: '/test',
      onClick: onClickStub
    });
    
    // Append to DOM to ensure rendering completes
    document.body.appendChild(link.getContent());
    
    // Save the original class
    const originalClass = link.element.className;
    
    // Simulate a click event
    const event = new MouseEvent('click');
    link.element.dispatchEvent(event);
    
    // Verify the class has been changed
    expect(link.element.className).to.not.equal(originalClass);
  });
  
  it('should update content when props change', () => {
    const link = new Link({
      text: 'Initial Text',
      href: '/test',
      onClick: Sinon.stub()
    });
    
    // Append to DOM to ensure rendering completes
    document.body.appendChild(link.getContent());
    
    // Ensure the original text is correct
    expect(link.element.textContent).to.equal('Initial Text');
    
    // Use sinon to spy on the event emitter
    const eventBusSpy = Sinon.spy(link.eventBus(), 'emit');
    
    // Update props directly
    link.setProps({ text: 'Updated Text' });
    
    // Verify the update flow was triggered
    expect(eventBusSpy.calledWith('flow:component-did-update')).to.be.true;
    
    // Verify the text was updated in the DOM
    expect(link.element.textContent).to.equal('Updated Text');
  });
});