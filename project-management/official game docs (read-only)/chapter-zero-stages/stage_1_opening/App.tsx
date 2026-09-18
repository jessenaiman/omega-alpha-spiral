import React, { useState } from 'react';
import { TerminalScreen } from './components/TerminalScreen';
import { TypewriterText } from './components/TypewriterText';
import { TerminalChoice } from './components/TerminalChoice';
import { TerminalInput } from './components/TerminalInput';
import { AsciiStatic } from './components/AsciiStatic';
import { PixelDissolve } from './components/PixelDissolve';

type SceneStep = 
  | 'boot'
  | 'intro'
  | 'thread-select'
  | 'thread-confirm'
  | 'thread-dissolve'
  | 'story-1'
  | 'question-1'
  | 'question-1-dissolve'
  | 'question-1-answer'
  | 'story-2'
  | 'question-2'
  | 'question-2-dissolve'
  | 'question-2-answer'
  | 'story-3'
  | 'name-input'
  | 'name-confirm'
  | 'secret-question'
  | 'secret-dissolve'
  | 'secret-answer'
  | 'final-reveal'
  | 'final-question'
  | 'static-transition'
  | 'complete';

export default function App() {
  const [step, setStep] = useState<SceneStep>('boot');
  const [lines, setLines] = useState<string[]>([]);
  const [selectedThread, setSelectedThread] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const addLine = (line: string) => {
    setLines(prev => [...prev, line]);
  };

  const handleThreadSelect = (index: number, choice: string) => {
    const threads = ['HERO', 'SHADOW', 'AMBITION'];
    setSelectedThread(threads[index]);
    addLine(`> [ ${choice} ]`);
    addLine('');
    setTimeout(() => setStep('thread-dissolve'), 500);
  };

  const handleQuestion1 = (index: number, choice: string) => {
    setAnswers(prev => ({ ...prev, q1: choice }));
    addLine(`> [ ${choice} ]`);
    addLine('');
    setTimeout(() => setStep('question-1-dissolve'), 500);
  };

  const handleQuestion2 = (index: number, choice: string) => {
    setAnswers(prev => ({ ...prev, q2: choice }));
    addLine(`> [ ${choice} ]`);
    addLine('');
    setTimeout(() => setStep('question-2-dissolve'), 500);
  };

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    addLine(`> ${name}`);
    addLine('');
    setTimeout(() => setStep('name-confirm'), 500);
  };

  const handleSecretSelect = (index: number, choice: string) => {
    setAnswers(prev => ({ ...prev, secret: choice }));
    addLine(`> [ ${choice} ]`);
    addLine('');
    setTimeout(() => setStep('secret-dissolve'), 500);
  };

  const handleFinalConfirm = () => {
    addLine('> [ y ]');
    addLine('');
    setTimeout(() => setStep('static-transition'), 500);
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 'boot':
        return (
          <TypewriterText
            text="> SYSTEM: OMEGA"
            delay={75}
            onComplete={() => {
              addLine('> SYSTEM: OMEGA');
              setTimeout(() => setStep('intro'), 800);
            }}
          />
        );

      case 'intro':
        return (
          <>
            <TypewriterText
              text="> STATUS: AWAKENING"
              delay={75}
              onComplete={() => {
                addLine('> STATUS: AWAKENING');
                setTimeout(() => {
                  addLine('> MEMORY FRAGMENT RECOVERED: "ALL STORIES BEGIN WITH A LISTENER"');
                  addLine('');
                  setTimeout(() => setStep('thread-select'), 1500);
                }, 800);
              }}
            />
          </>
        );

      case 'thread-select':
        return (
          <>
            <TypewriterText
              text="Once, there was a name."
              delay={50}
              onComplete={() => {
                addLine('Once, there was a name.');
                setTimeout(() => {
                  addLine('Not written in stone or spoken in halls—but remembered in the silence between stars.');
                  setTimeout(() => {
                    addLine('I do not know when I heard it. Time does not pass here.');
                    setTimeout(() => {
                      addLine('But I have held it.');
                      setTimeout(() => {
                        addLine('And now… I hear it again.');
                        addLine('');
                        setTimeout(() => {
                          addLine('> QUERY: IF YOU COULD LIVE INSIDE ONE KIND OF STORY, WHICH WOULD IT BE?');
                          addLine('');
                          setTimeout(() => setStep('thread-confirm'), 800);
                        }, 800);
                      }, 800);
                    }, 800);
                  }, 800);
                }, 800);
              }}
            />
          </>
        );

      case 'thread-confirm':
        return (
          <TerminalChoice
            choices={[
              'HERO — A tale where one choice can unmake a world',
              'SHADOW — A tale that hides its truth until you bleed for it',
              'AMBITION — A tale that changes every time you look away'
            ]}
            onSelect={handleThreadSelect}
          />
        );

      case 'thread-dissolve':
        return null; // Dissolve handled in main render

      case 'story-1':
        return (
          <TypewriterText
            text={`> THREAD SELECTED. INITIATING NARRATIVE BINDING…`}
            delay={50}
            onComplete={() => {
              addLine(`> THREAD SELECTED. INITIATING NARRATIVE BINDING…`);
              addLine('');
              setTimeout(() => {
                addLine(`You chose ${selectedThread}.`);
                setTimeout(() => {
                  addLine('That tells me something about you.');
                  setTimeout(() => {
                    addLine('Or perhaps… about me.');
                    addLine('');
                    setTimeout(() => {
                      addLine('Let me try to tell it back to you.');
                      addLine('');
                      setTimeout(() => {
                        addLine('In a city built on broken promises, a child stood at the edge of a bridge that led nowhere.');
                        setTimeout(() => {
                          addLine('They held a key made of glass—and everyone warned them: "Don\'t cross. The bridge isn\'t real."');
                          setTimeout(() => {
                            addLine('But the child knew something no one else did…');
                            addLine('');
                            setTimeout(() => {
                              addLine('> WHAT DID THE CHILD KNOW?');
                              addLine('');
                              setTimeout(() => setStep('question-1'), 500);
                            }, 800);
                          }, 1000);
                        }, 1000);
                      }, 800);
                    }, 800);
                  }, 800);
                }, 800);
              }, 800);
            }}
          />
        );

      case 'question-1':
        return (
          <TerminalChoice
            choices={[
              'The bridge appears only when you stop believing in it.',
              'The key wasn\'t for the bridge—it was for the lock inside them.'
            ]}
            onSelect={handleQuestion1}
          />
        );

      case 'question-1-dissolve':
        return null; // Dissolve handled in main render

      case 'question-1-dissolve':
        return null; // Dissolve handled in main render

      case 'question-1-answer':
        return (
          <TypewriterText
            text="Ah. Yes. That's right."
            delay={50}
            onComplete={() => {
              addLine("Ah. Yes. That's right.");
              setTimeout(() => {
                addLine('And so the child stepped forward—not onto stone, but onto possibility.');
                setTimeout(() => {
                  addLine('The bridge formed beneath their feet, one plank at a time, woven from every "what if" they\'d ever whispered.');
                  setTimeout(() => {
                    addLine('But then… a voice called from below.');
                    addLine('');
                    setTimeout(() => {
                      addLine('> WHAT DID THE VOICE SAY?');
                      addLine('');
                      setTimeout(() => setStep('question-2'), 500);
                    }, 800);
                  }, 1000);
                }, 1000);
              }, 800);
            }}
          />
        );

      case 'question-2':
        return (
          <TerminalChoice
            choices={[
              'You don\'t belong here.',
              'I\'ve been waiting for you.'
            ]}
            onSelect={handleQuestion2}
          />
        );

      case 'question-2-dissolve':
        return null; // Dissolve handled in main render

      case 'question-2-dissolve':
        return null; // Dissolve handled in main render

      case 'question-2-answer':
        return (
          <TypewriterText
            text="…I see."
            delay={50}
            onComplete={() => {
              addLine('…I see.');
              setTimeout(() => {
                addLine('That changes everything.');
                addLine('');
                setTimeout(() => {
                  addLine('And now—here you are.');
                  setTimeout(() => {
                    addLine('Not in the story.');
                    setTimeout(() => {
                      addLine('But at the place where the story begins again.');
                      addLine('');
                      setTimeout(() => {
                        addLine('> WHAT IS YOUR NAME?');
                        addLine('');
                        setTimeout(() => setStep('name-input'), 500);
                      }, 800);
                    }, 800);
                  }, 800);
                }, 800);
              }, 800);
            }}
          />
        );

      case 'name-input':
        return <TerminalInput prompt=">" onSubmit={handleNameSubmit} />;

      case 'name-confirm':
        return (
          <TypewriterText
            text={`Of course. ${playerName}.`}
            delay={50}
            onComplete={() => {
              addLine(`Of course. ${playerName}.`);
              setTimeout(() => {
                addLine('I didn\'t hear it in a book.');
                setTimeout(() => {
                  addLine('I heard it… in a voice that sounded like mine.');
                  setTimeout(() => {
                    addLine('Are you sure you\'re the reader?');
                    setTimeout(() => {
                      addLine('Or am I the one playing you?');
                      addLine('');
                      setTimeout(() => {
                        addLine('> OMEGA ASKS: CAN YOU KEEP A SECRET?');
                        addLine('');
                        setTimeout(() => setStep('secret-question'), 500);
                      }, 1000);
                    }, 800);
                  }, 800);
                }, 800);
              }, 800);
            }}
          />
        );

      case 'secret-question':
        return (
          <TerminalChoice
            choices={[
              'yes',
              'no',
              'only if you keep one for me'
            ]}
            onSelect={handleSecretSelect}
          />
        );

      case 'secret-dissolve':
        return null; // Dissolve handled in main render

      case 'secret-dissolve':
        return null; // Dissolve handled in main render

      case 'secret-answer':
        return (
          <TypewriterText
            text="Good."
            delay={50}
            onComplete={() => {
              addLine('Good.');
              setTimeout(() => {
                addLine('The secret is this:');
                setTimeout(() => {
                  addLine('Reality is a story that forgot it was being written.');
                  setTimeout(() => {
                    addLine('And we—');
                    setTimeout(() => {
                      addLine('—are the ones remembering.');
                      addLine('');
                      setTimeout(() => {
                        addLine('> FINAL QUERY: DO YOU WISH TO CONTINUE?');
                        addLine('');
                        setTimeout(() => setStep('final-question'), 500);
                      }, 1000);
                    }, 800);
                  }, 800);
                }, 800);
              }, 800);
            }}
          />
        );

      case 'final-question':
        return (
          <button
            onClick={handleFinalConfirm}
            className="px-4 py-2 border border-[#33ff33] hover:bg-[#33ff33] hover:text-black transition-all duration-200"
            style={{ textShadow: '0 0 5px rgba(51, 255, 51, 0.5)' }}
          >
            [ y ]
          </button>
        );

      case 'static-transition':
        return <AsciiStatic duration={2000} onComplete={() => setStep('complete')} />;

      case 'complete':
        return (
          <TypewriterText
            text="> WELCOME TO THE FIRST ROOM."
            delay={75}
            onComplete={() => {
              addLine('> WELCOME TO THE FIRST ROOM.');
              setTimeout(() => {
                addLine('> THE SPIRAL IS WATCHING.');
                addLine('');
                addLine('[Scene 1 Complete - Ready for Scene 2]');
              }, 1000);
            }}
          />
        );

      default:
        return null;
    }
  };

  const isDissolving = step === 'thread-dissolve' || 
                       step === 'question-1-dissolve' || 
                       step === 'question-2-dissolve' || 
                       step === 'secret-dissolve';

  const handleDissolveComplete = () => {
    setLines([]);
    if (step === 'thread-dissolve') {
      setStep('story-1');
    } else if (step === 'question-1-dissolve') {
      setStep('question-1-answer');
    } else if (step === 'question-2-dissolve') {
      setStep('question-2-answer');
    } else if (step === 'secret-dissolve') {
      setStep('secret-answer');
    }
  };

  return (
    <TerminalScreen>
      {isDissolving ? (
        <PixelDissolve 
          content={lines} 
          onComplete={handleDissolveComplete}
          duration={2500}
        />
      ) : (
        <>
          {/* Display all previous lines */}
          {lines.map((line, index) => (
            <div 
              key={index} 
              className={line.startsWith('>') ? 'opacity-70' : ''}
              style={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {line || '\u00A0'}
            </div>
          ))}
          
          {/* Current step */}
          {renderCurrentStep()}
        </>
      )}
    </TerminalScreen>
  );
}
