import Hub from './pages/Hub';
import MasterHub from './pages/MasterHub';
import NodeView from './pages/NodeView';
import Messages from './pages/Messages';


export const PAGES = {
    "Hub": Hub,
    "MasterHub": MasterHub,
    "NodeView": NodeView,
    "Messages": Messages,
}

export const pagesConfig = {
    mainPage: "Hub",
    Pages: PAGES,
};