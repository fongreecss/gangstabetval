// Initialize button with user's preferred color

/*let changeColor = document.getElementById("changeColor");

chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color;
});
*/

// When the button is clicked, inject setPageBackgroundColor into current page
/*changeColor.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: setPageBackgroundColor,
    });
  });
  */
// The body of this function will be executed as a content script inside the
// current page

try {
  let upgradeLevels = [0, 7, 14, 21, 35, 49, 70, 91, 114, 135, 171];
  let upgradeSumLevels = [];
  let sum = 0;
  for (let i = 0; i < upgradeLevels.length; i++) {
    sum = sum + upgradeLevels[i] * 50;
    upgradeSumLevels.push(sum);
  }

  function scrapeNFTData() {
    let priceStr = document.querySelector(".price-ICX");
    let priceUnit =  '';
    let url = window.location.href;
    let tokenId = '0x' + parseInt(url.split("/")[url.split("/").length - 1]).toString(16);
    let priceNr = 0;
    let price = 0;
    let realPrice = 0;
    let multipliers = { K: 1000, M: 1000000, B: 1000000000 };
    let multiplier = 1;
    let accumulatedGbet = parseInt(document.querySelector(".gp-accumulated-gbet .quantity").innerText);
    
    if (priceStr) {
      priceUnit =  priceStr.querySelector('.unit').innerText;
      console.log(priceStr.innerText);
      priceStr = priceStr.innerText;
      priceStr = priceStr.split(priceUnit).join('').trim();
      priceNr = parseFloat(priceStr);
      multiplier =  multipliers[priceStr[priceStr.length-1]] ? multipliers[priceStr[priceStr.length-1]] : 1;
      price = priceNr;
      realPrice = price * multiplier;
    } else {
      realPrice = 0;
    }
    
    return { 
      "tokenId": tokenId, 
      "realPrice": realPrice, 
      "accumulatedGbet": accumulatedGbet 
    };
  }

  function getNFTRealId(nftData) {
    let tab = nftData.tabs[0];
    console.log(tab);
    chrome.scripting.executeScript(
      {
        target: {
          tabId: tab.id,
          allFrames: true,
        },
        function: scrapeNFTData,
      },
      (cba) => {
        echoNFTData(cba[0].result);
      }
    );
  }

  function echoNFTData(result) {
    //what you get from the function
    let nftPriceIcx = result.realPrice;
    console.log(result.realPrice);
    let tokenId = result.tokenId;
    let accumulatedGbet = result.accumulatedGbet;
    //what you calculate
    let nftPriceUsdt = 0;
    let stats = 0;
    let accumulatedGbetPriceIcx  = 0;
    let accumulatedGbetPriceUsdt = 0;
    let level = 0;
    let ul = 0;
    let gbetUsed = 0;
    let icxPrice = 0;
    let gbetPrice = 0;
    let gbetUsdtUsed = 0;
    let gbetUsdtUsedMax = 0;
    let gbetIcxUsed = 0;
    let gbetIcxUsedMax = 0;
    let floorPriceIcx = 0;
    let floorPriceUsdt = 0;
    let estimatedPriceIcx = 0;
    let estimatedPriceUsdt = 0;
    let verdict = '';
    let color = '#0ff';

    Promise.all([
      fetch(`https://balanced.geometry.io/api/v1/stats/token-stats`).then((response) => response.json()),
      fetch(`https://gangsta-node-main.herokuapp.com/api/transactionanalytics`).then((response) => response.json()),
      fetch(`https://gangsta-node-main.herokuapp.com/api/token/${tokenId}`).then((response) => response.json())
    ]).then(([tokenStats, transactionanalytics, tokenNftData]) => {
      
      stats = parseInt(tokenNftData.statistics.current_stats);
      level = Math.floor(stats / 50);
      ul = stats >= 500 ? upgradeLevels[level] : upgradeLevels[level+1];
      
      icxPrice = parseInt(tokenStats.tokens.ICX.price, 16) * Math.pow(10, -18);
      gbetPrice = parseInt(tokenStats.tokens.GBET.price, 16) * Math.pow(10, -18);
      
      document.getElementById("icxPrice").innerHTML = icxPrice.toFixed(4);
      document.getElementById("gbetPrice").innerHTML = gbetPrice.toFixed(4);

      gbetUsed = upgradeSumLevels[level] + (stats % 50) * ul;
      gbetUsdtUsed = gbetUsed * gbetPrice;
      gbetUsdtUsedMax = upgradeSumLevels[10] * gbetPrice;
      gbetIcxUsed = gbetUsed * gbetPrice / icxPrice;
      gbetIcxUsedMax = upgradeSumLevels[10] * gbetPrice / icxPrice;
      accumulatedGbetPriceIcx  = accumulatedGbet * gbetPrice / icxPrice;
      accumulatedGbetPriceUsdt  = accumulatedGbetPriceIcx * icxPrice;
      //end token stats
      document.getElementById("nftName").innerHTML = tokenNftData.token_name;
      document.getElementById("nftImage").src = tokenNftData.token_uri;
      document.getElementById("nftID").innerHTML = tokenNftData.token_id;
      document.getElementById("nftLevel").innerHTML = stats >= 500 ? level : level + 1;
      document.getElementById("nftSkill").innerHTML = stats;
      document.getElementById("nftSkill2").innerHTML = stats;
      document.getElementById("nftGbetUsed").innerHTML = gbetUsed;
      document.getElementById("nftGbetUsdtUsed").innerHTML = gbetUsdtUsed.toFixed(0);
      document.getElementById("nftGbetUsdtUsedMax").innerHTML = gbetUsdtUsedMax.toFixed(0);
      document.getElementById("nftGbetIcxUsed").innerHTML = gbetIcxUsed.toFixed(0);
      document.getElementById("nftGbetIcxUsedMax").innerHTML = gbetIcxUsedMax.toFixed(0);
      document.getElementById("nftAccumulatedGbet").innerHTML = accumulatedGbet;
      document.getElementById("nftAccumulatedGbetIcx").innerHTML = accumulatedGbetPriceIcx.toFixed(0);
      document.getElementById("nftAccumulatedGbetUsdt").innerHTML = accumulatedGbetPriceUsdt.toFixed(0);
      //end nft data
      floorPriceIcx = parseFloat(transactionanalytics.gangsta_marketplace.floor_price);
      floorPriceUsdt = floorPriceIcx * icxPrice;
      estimatedPriceIcx = accumulatedGbetPriceIcx + floorPriceIcx + gbetIcxUsed;
      estimatedPriceUsdt = estimatedPriceIcx * icxPrice;
      document.getElementById("nftFloorPriceIcx").innerHTML = floorPriceIcx.toFixed(0);
      document.getElementById("nftFloorPriceUsdt").innerHTML = floorPriceUsdt.toFixed(0);
      document.getElementById("recommendedSalePriceIcx").innerHTML = estimatedPriceIcx.toFixed(0);
      document.getElementById("recommendedSalePriceUsdt").innerHTML = estimatedPriceUsdt.toFixed(0);
      //end transaction analytics
      nftPriceUsdt = nftPriceIcx * icxPrice;
      document.getElementById("nftSalePriceIcx").innerHTML = nftPriceIcx.toFixed(0);
      document.getElementById("nftSalePriceUsdt").innerHTML = nftPriceUsdt.toFixed(0);
      verdict = Math.abs(nftPriceIcx - estimatedPriceIcx).toFixed(0);
      if(nftPriceIcx > estimatedPriceIcx) {
        color = '#f00';
        verdict += " ICX OVER";
      } else if(nftPriceIcx < estimatedPriceIcx) {
        color = '#0ff';
        verdict += " ICX UNDER";
      }
      document.getElementById('nftVerdict').style = `color: ${color}`;
      document.getElementById('nftVerdict').innerHTML = verdict;
      //end
      document.getElementById("notOnPage").style.display = "none";
      document.getElementById("content").classList.add("active");
      document.getElementById("nftNameContainer").classList.add("active");
    });

  }

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    let url = tabs[0].url;
    let title = tabs[0].title;
    let nftData = {
      tabs: tabs,
      url: url,
      title: title,
    };

    if (url.includes("gangstabet.io/profile/")) {
      getNFTRealId(nftData);
    }
  });
} catch (error) {
  console.log(error);
}

//icx price
//https://api.coingecko.com/api/v3/simple/price?ids=icon&vs_currencies=usd

//https://gbet.mypinata.cloud/ipfs/QmZRBtJHrhCZtxCy9ArwGGMNstsp5JKv7GxW8AQ5qo39tF/

//id na sliki je pravi id
//https://api.gangstabet.io/api/index/5523
//https://api.gangstabet.io/api/transactionanalytics
//https://gbet.mypinata.cloud/ipfs/QmYCQudEvXLbkgsnWjGKqBf6JVNREcV4Soni4CuQWxYQLt/19.json
//https://balanced.geometry.io/api/v1/stats/token-stats
//balanced.geometry.io/api/v1/dex/stats/17
//https://gangsta-node-main.herokuapp.com/api/transactionanalytics