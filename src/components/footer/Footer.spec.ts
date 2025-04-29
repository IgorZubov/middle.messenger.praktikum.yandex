// @ts-nocheck
import { expect } from "chai";
import Sinon from "sinon";
import { Footer } from "./Footer";
import { Link } from "../link/Link";

// Mock CSS import without actually importing it
// The CSS loader will handle this when imported
const cssStyles = {};

describe('Footer Component Tests', () => {
  beforeEach(() => {
    // Create a fresh DOM environment for each test
    document.body.innerHTML = '';
  });
  
  afterEach(() => {
    // Clean up all Sinon stubs, mocks, and fake timers
    Sinon.restore();
  });
  
  it('should render with the correct CSS class', () => {
    const footer = new Footer();
    
    // Append to DOM to ensure rendering completes
    document.body.appendChild(footer.getContent());
    
    // Check that the footer has the correct class
    expect(footer.element.className).to.include('footer');
  });
  
  it('should contain two Link components', () => {
    const footer = new Footer();
    
    // Append to DOM to ensure rendering completes
    document.body.appendChild(footer.getContent());
    
    // Check that there are two links inside the footer
    const links = footer.element.querySelectorAll('a');
    expect(links.length).to.equal(2);
  });
  
  it('should handle click events on the first link', () => {
    // Create spies for console.log to check if it's called
    const consoleLogSpy = Sinon.spy(console, 'log');
    
    const footer = new Footer();
    
    // Append to DOM to ensure rendering completes
    document.body.appendChild(footer.getContent());
    
    // Get the first link and simulate a click
    const firstLink = footer.element.querySelectorAll('a')[0];
    
    // Create and dispatch a click event
    const clickEvent = new MouseEvent('click');
    firstLink.dispatchEvent(clickEvent);
    
    // Verify that console.log was called with 'CLICK'
    expect(consoleLogSpy.calledWith('CLICK')).to.be.true;
  });
  
  it('should pass CSS classes to child components', () => {
    // Spy on the Link constructor to verify classes are passed
    const linkSpy = Sinon.spy(Link.prototype, 'constructor');
    
    const footer = new Footer();
    document.body.appendChild(footer.getContent());
    
    // Check that all links have the footer-link class
    const links = footer.element.querySelectorAll('a');
    for (let i = 0; i < links.length; i++) {
      expect(links[i].className).to.include('footer-link');
    }
  });
  
  it('should demonstrate async component state updates with Sinon', async () => {
    // Create a Footer component
    const footer = new Footer();
    document.body.appendChild(footer.getContent());
    
    // Get the current state of links
    const initialLinks = footer.element.querySelectorAll('a');
    expect(initialLinks.length).to.equal(2);
    
    // Setup an async operation with Sinon clock
    const clock = Sinon.useFakeTimers();
    
    // Create a promise that will resolve after updating the component
    const updatePromise = new Promise(resolve => {
      setTimeout(() => {
        // Get reference to the child Link component
        const childLink = footer.children.LinkCreate;
        
        // Create a spy for the render method
        const renderSpy = Sinon.spy(childLink, '_render');
        
        // Update the child component props
        childLink.setProps({ text: 'Async Updated Text' });
        
        // Check that render was called
        expect(renderSpy.called).to.be.true;
        
        resolve();
      }, 100);
    });
    
    // Fast-forward time to trigger our timeout
    await clock.tickAsync(100);
    
    // Wait for our promise to resolve
    await updatePromise;
    
    // When we update the props of a child component, it should re-render
    // We're testing that the async operation worked
    clock.restore();
  });
});
