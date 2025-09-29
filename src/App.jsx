
import './config/fabric';
import { ChakraProvider } from '@chakra-ui/react';
import { Provider } from 'react-redux';
import { Home } from './pages/Home';
import store from './store/store';

function App() {
  return (
    <ChakraProvider>
      <Provider store={store}>
        <Home />
      </Provider>
    </ChakraProvider>
  );
}

export default App;
