import Navbar from "../components/Navbar";
import colors from "../theme/colors";
import { useEffect, useState } from "react";

import ChallengesList from "../components/friends/ChallengesList";
import PendingRequests from "../components/friends/PendingRequests";
import FriendsList from "../components/friends/FriendsList";
import SearchBar from "../components/friends/SearchBar";

/**
  Inspiration for this friends page, from figma make. Edited to be simpler and fit our app better,
  additionally, it is split into components and useEffect is added to connect to flask backend.  
*/
export default function Friends() {
    const isLoggedIn = true;
    const isSticky = false;

    const [challenges, setChallenges] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [friends, setFriends] = useState([]);

    useEffect(() => { //This will be used to connect to the backend

        setPendingRequests([
            { id: "1", user: { username: "@emma_w" }, date: "3 hours ago" },
            { id: "2", user: { username: "@david_l" }, date: "1 day ago" }
        ]);

        setFriends([
            { id: "1", username: "@sarah_j" },
            { id: "2", username: "@mike_c" },
            { id: "3", username: "@jess_b" },
            { id: "4", username: "@alex_m" }
        ]);
    }, []);

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.lightGreen }}>
            <Navbar isLoggedIn={isLoggedIn} isSticky={isSticky} /> {/**This is the navigation bar */}

            <div className="max-w-5xl mx-auto p-6 space-y-8"> {/**This will setup the spacing between elements on the page*/}
                {/**These are the elements for the page, they take in the list of items (challenges, pending request, or friends and send them to the component*/}
                <ChallengesList challenges={challenges} />
                <PendingRequests pendingRequests={pendingRequests} />
                <SearchBar />
                <FriendsList friends={friends} />
            </div>
        </div>
    );
}
