import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import '@fontsource-variable/jetbrains-mono';
import App from './App';
import { ErrorBox } from './components/ui';
import { Button } from './components/ui/button';
import { TooltipProvider } from './components/ui/tooltip';
import './index.css';
class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
    };
  }
  static getDerivedStateFromError(error) {
    return {
      error,
    };
  }
  render() {
    return this.state.error ? (
      <div className="mx-auto max-w-lg space-y-4 p-8">
        <ErrorBox error={this.state.error} />
        <Button onClick={() => location.reload()}>Reload</Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById('root')).render(
  <Boundary>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </Boundary>,
);
