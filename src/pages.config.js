import Hub from './pages/Hub';
import MasterHub from './pages/MasterHub';
import Messages from './pages/Messages';
import NodeView from './pages/NodeView';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Hub": Hub,
    "MasterHub": MasterHub,
    "Messages": Messages,
    "NodeView": NodeView,
}

export const pagesConfig = {
    mainPage: "Hub",
    Pages: PAGES,
    Layout: __Layout,
};