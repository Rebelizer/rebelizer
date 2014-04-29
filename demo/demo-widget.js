(function() {

  function renderIt(renderTree, node) {
    var $scope = renderTree.scope;
    var out = '<ul data-rid="';

    out+= renderTree.id + '"><h2>Click on a letter to move it to the top.</h2>';

    // use paging if you want $scope.page, $scope.show
    for(var i=$scope.offset, len = $scope.items.length; i<len; i++) {
      out+='<li>' + $scope.items[i] + '</li>';
    }

    out+='</ul>';

    renderTree.boundTo('$scope.scope.items');
    renderTree.boundTo('$scope.scope.offset');

    return out;
  }

  itemClickFn = function() {
    var item = this.$scope.items.splice(this.index,1);
    this.$scope.items = item.concat(this.$scope.items);
  }

  function demoEvent(renderTree) {
    var $scope = renderTree.scope;
    var s = $scope.offset;

    $('[data-rid='+renderTree.id+ '] li').each(function(i, el) {
      i = s+i;
      $(el).click(itemClickFn.bind({item:$scope.items[i], $scope:$scope, index:i}));
    })
  }

  if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
    module.exports.renderIt = renderIt;
    module.exports.demoEvent = demoEvent;
  } else {
    window.rebelizer = window.rebelizer || {}
    window.rebelizer.renderIt = renderIt;
    window.rebelizer.demoEvent = demoEvent;

    $().ready(function() {
      renderTREE.plugins.demoWidget = {renderIt:renderIt, demoEvent:demoEvent};
      renderTREE.plugins['demoWidget'].demoEvent(renderTREE);
    })
  }


})();
