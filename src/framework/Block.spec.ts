// @ts-nocheck
import { expect } from "chai";
import Block from "./Block";
import Sinon from "sinon";

describe('Smoke test for Components', () => {
    describe('Test block', () => {
        let blockClass: typeof Block;
    
        before(() =>  {
            class Button extends Block {
                constructor(props: any) {
                  super({
                    ...props,
                  })
                }
              
                render() {
                  return `<div id="div">{{text}}</div>`
                }
              }
    
              blockClass = Button;
        })
    
        it('render props', () => {
            const textData = 'I am div!';
            const buttonComponent = new blockClass({text: textData})
            const res = (buttonComponent.element as unknown as HTMLDivElement)?.innerHTML;
    
            expect(res).to.be.eq(textData);
        })
    
        it('handle click', () => {
            const handler = Sinon.stub();
            const buttonComponent = new blockClass({text: 'I am button!', events: 
                {click: handler}
            });

            const event = new MouseEvent('click');
            (buttonComponent.element as unknown as HTMLDivElement)?.dispatchEvent(event);
    
            expect(handler.calledOnce).to.be.true;
        })
    
        it('Invoke _render', () => {
           //const clock = Sinon.useFakeTimers();
            const buttonComponent = new blockClass();
    
            const spyDCM = Sinon.spy(buttonComponent, '_render');
            buttonComponent.setProps({text: "bla"});
            //document.body.append(el!);
            //clock.next();
    
            expect(spyDCM.calledOnce).to.be.true;
        })
    })
    
    // describe('Test case #4', () => {
    //     expect('2').to.be.eq('2');
    // })
})
