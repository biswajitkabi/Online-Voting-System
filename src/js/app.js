// Import required modules
const Web3 = require("web3");
const contract = require("@truffle/contract");

const votingArtifacts = require("../../build/contracts/Voting.json");
var VotingContract = contract(votingArtifacts);

window.App = {
  eventStart: async function () {
    try {
      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Get the user's accounts
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      const account = accounts[0]; // Use the first account

      // Set the provider and defaults for the contract
      VotingContract.setProvider(window.ethereum);
      VotingContract.defaults({ from: account, gas: 6654755 });

      // Load account data
      App.account = account;
      $("#accountAddress").html("Your Account: " + account);

      // Deploy the contract and interact with it
      VotingContract.deployed()
        .then(function (instance) {
          instance.getCountCandidates().then(function (countCandidates) {
            $(document).ready(function () {
              $("#addCandidate").click(function () {
                var nameCandidate = $("#name").val();
                var partyCandidate = $("#party").val();
                instance
                  .addCandidate(nameCandidate, partyCandidate)
                  .then(function (result) {});
              });
              $("#addDate").click(function () {
                var startDate =
                  Date.parse(document.getElementById("startDate").value) / 1000;
                var endDate =
                  Date.parse(document.getElementById("endDate").value) / 1000;
                instance.setDates(startDate, endDate).then(function (rslt) {
                  console.log("Dates set");
                });
              });

              instance
                .getDates()
                .then(function (result) {
                  var startDate = new Date(result[0] * 1000);
                  var endDate = new Date(result[1] * 1000);
                  $("#dates").text(
                    startDate.toDateString() + " - " + endDate.toDateString()
                  );
                })
                .catch(function (err) {
                  console.error("ERROR! " + err.message);
                });
            });

            for (var i = 0; i < countCandidates; i++) {
              instance.getCandidate(i + 1).then(function (data) {
                var id = data[0];
                var name = data[1];
                var party = data[2];
                var voteCount = data[3];
                var viewCandidates =
                  `<tr><td><input class="form-check-input" type="radio" name="candidate" value="${id}" id=${id}>` +
                  name +
                  "</td><td>" +
                  party +
                  "</td><td>" +
                  voteCount +
                  "</td></tr>";
                $("#boxCandidate").append(viewCandidates);
              });
            }

            window.countCandidates = countCandidates;
          });

          instance.checkVote().then(function (voted) {
            console.log(voted);
            if (!voted) {
              $("#voteButton").attr("disabled", false);
            }
          });
        })
        .catch(function (err) {
          console.error("ERROR! " + err.message);
        });
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
    }
  },

  vote: function () {
    var candidateID = $("input[name='candidate']:checked").val();
    if (!candidateID) {
      $("#msg").html("<p>Please vote for a candidate.</p>");
      return;
    }
    VotingContract.deployed()
      .then(function (instance) {
        instance.vote(parseInt(candidateID)).then(function (result) {
          $("#voteButton").attr("disabled", true);
          $("#msg").html("<p>Voted</p>");
          window.location.reload(1);
        });
      })
      .catch(function (err) {
        console.error("ERROR! " + err.message);
      });
  },
};

window.addEventListener("load", function () {
  if (typeof window.ethereum !== "undefined") {
    console.warn("Using web3 detected from external source like MetaMask");
    window.App.eventStart(); // Call the function
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:9545.");
    // Handle the fallback
  }
});
