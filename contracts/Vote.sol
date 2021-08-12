pragma solidity >=0.8.0;

contract Vote {
    uint MAX_PIZZA_SIZE = 6;
    mapping(uint => Pizza) public pizzas;
    
    event PizzaCreated(uint id,uint likes,uint dislikes);
    struct Pizza{
        uint id;
        uint likes;
        uint dislikes;
    }

    constructor(){}
    
    function createPizza(uint _id) public{
        pizzas[_id] = Pizza(_id,0,0);
        emit PizzaCreated(_id, 0, 0);
    }

    function like(uint _id) public {
      pizzas[_id].likes += 1;
    }

    function dislike(uint _id) public {
      pizzas[_id].dislikes += 1;
    }

    function getPizza(uint _id) public view returns(Pizza memory) {
      return pizzas[_id];
    }

}