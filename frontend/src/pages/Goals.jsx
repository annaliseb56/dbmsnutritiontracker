import Navbar from "../components/Navbar";
import colors from "../theme/colors";


export default function Goals() {
    const isLoggedIn = true;
    const isSticky = false;

    return (
        <Navbar isLoggedIn={isLoggedIn} isSticky={isSticky} />
    );
}