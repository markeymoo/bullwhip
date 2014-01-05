// Load the Visualization API and the piechart package
google.load('visualization', '1.0', {'packages':['corechart']});

// Set a callback to run when the Google Visualization API is loaded.
google.setOnLoadCallback(initialiseBullwhip);


function initialiseBullwhip()
{
    var $globalDemand = 100;
    var $loopSize = 10;
    var $timePeriod = 0;
    
    // Set chart options
    var $productionGraphOptions = {'title':'Production Levels', 'width':1000, 'height':600};
    var $stockGraphOptions = {'title':'Stock Levels', 'width':1000, 'height':600};
    
    // Create Google Data Table for Production Levels and initialise with X-axis column.
    var $productionDataTable = new google.visualization.DataTable();
    $productionDataTable.addColumn('string', 'TimePeriod');
    $productionDataTable.addRows($loopSize);
    
    // Create Google Data Table for Stock Levels and initialise with X-axis column.
    var $stockDataTable = new google.visualization.DataTable();
    $stockDataTable.addColumn('string', 'TimePeriod');
    $stockDataTable.addRows($loopSize);
    
    // Create OEM + 3 Supplier Tier Objects
    var $tier3 = new tierSupplier(4, "Tier3", $globalDemand, null, $productionDataTable, $stockDataTable);
    var $tier2 = new tierSupplier(3, "Tier2", $globalDemand, $tier3, $productionDataTable, $stockDataTable);
    var $tier1 = new tierSupplier(2, "Tier1", $globalDemand, $tier2, $productionDataTable, $stockDataTable);
    var $oem = new tierSupplier(1, "OEM", $globalDemand, $tier1, $productionDataTable, $stockDataTable);
    
    var $interval = setInterval( function() {
                                                if($timePeriod == 1)
                                                {
                                                    $globalDemand = 95;
                                                }
                                                
                                                $oem.processTimePeriod($timePeriod, $globalDemand);
                                                
                                                var prodCSV = google.visualization.dataTableToCsv($productionDataTable);
                                                console.log(prodCSV);
                                                
                                                var stockCSV = google.visualization.dataTableToCsv($stockDataTable);
                                                console.log(stockCSV);
                                                
                                                // Update Chart
                                                var prodChart = new google.visualization.LineChart(document.getElementById('prod_div'));
                                                var stockChart = new google.visualization.LineChart(document.getElementById('stock_div'));
                                                prodChart.draw($productionDataTable, $productionGraphOptions);
                                                stockChart.draw($stockDataTable, $stockGraphOptions);
                                                
                                                // Increment Time Period
                                                $timePeriod++;
                                                
                                                if( $timePeriod == $loopSize )
                                                {
                                                    clearInterval($interval);
                                                }
                                            }
                                , 1000 );
}


function tierSupplier($position, $identifier, $demandLevel, $previousTier, $prodDataTable, $stockDataTable)
{
    this.$position = $position;
    this.$identifier = $identifier;
    this.$previousTier = $previousTier;
    this.$productionDataTable = $prodDataTable;
    this.$stockDataTable = $stockDataTable;
    this.$stock = $demandLevel;
    
    // Create column within Google Data Table for this object
    this.$productionDataTable.addColumn('number', $identifier);
    this.$stockDataTable.addColumn('number', $identifier);
}


tierSupplier.prototype = {
  processTimePeriod: function($periodNumber, $revisedDemand)
  {

      
      // Calculate required production level to maintain stock at demand level
      var $reqDemand = $revisedDemand - (this.$stock - $revisedDemand);
      this.$stock = $revisedDemand;
      
      this.$productionDataTable.setCell($periodNumber, this.$position, $reqDemand);
      this.$stockDataTable.setCell($periodNumber, this.$position, this.$stock);
      
      if( this.$previousTier === null )
      {
          return;
      }
      
      // Pass on desired demand to next entity in supply chain
      this.$previousTier.processTimePeriod($periodNumber, $reqDemand);
  }
}