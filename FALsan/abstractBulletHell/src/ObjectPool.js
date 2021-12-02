// This tab is independent.
// Last update: 20. Sep. 2017

// 改めて読むとよくわかんないなこれ・・
// まあ最初から理解できてなかったしじっくり理解するのがよいだろうね
class ObjectPool_Bullet{
  constructor(pSize = 256){
    this.poolSize = pSize;
    // この2つの配列の違いがわかんないのよね
    this.pool = new Array(pSize);
    this.temporalInstanceList = new Array(pSize);
    this.index = 0;
    this.temporalInstanceCount = 0;
    this.allocationCount = 0;
  }
  allocate(){
    // 戻り値はBulletクラス
    if(this.isAllocatable() == false){
      console.log("Object pool allocation failed. Too many objects created!");
      // Need exception handling
      return null;
    }
    let allocatedInstance = this.pool[this.index]; // 多分これでOK.

    allocatedInstance.setAllocated(true);
    allocatedInstance.setAllocationIdentifier(allocationCount);
    this.index++;
    this.allocationCount++;

    return allocatedInstance;
  }
  allocateTemporal(){
    // 戻り値はBulletクラス
    let allocatedInstance = this.allocate();
    this.setTemporal(allocatedInstance);
    return allocatedInstance;
  }
  storeObject(obj){
    // objはBulletクラス
    if(this.pool.length >= this.poolSize) {
      console.log("Failed to store a new instance to object pool. Object pool is already full.");
      // Need exception handling
    }
    this.pool.push(obj);
    obj.setBelongingPool(this);
    obj.setAllocationIdentifier(-1); // not allocatedという意味
    obj.setAllocated(false);
  }
  isAllocatable(){
    return this.index < this.poolSize;
  }
  deallocate(killedObject){
    if(!killedObject.isAllocated()){
      return;
    }
    killedObject.initialize();
    killedObject.setAllocated(false);
    killedObject.setAllocationIdentifier(-1);
    this.index--;
    this.pool.set(this.index, killedObject);
  }
  update(){
    while(this.temporalInstanceCount > 0){
      this.temporalInstanceCount--;
      this.deallocate(this.temporalInstanceList[this.temporalInstanceCount]);
    }
    this.temporalInstanceList = [];    // not needed when array
  }
  setTemporal(obj){
    this.temporalInstanceList.push(obj);    // set when array
    this.temporalInstanceCount++;
  }
}


/*

//-------------------------------
interface Poolable
{
  public boolean isAllocated();
  public void setAllocated(boolean indicator);
  public ObjectPool getBelongingPool();
  public void setBelongingPool(ObjectPool pool);
  public int getAllocationIdentifier();  // -1 : not allocated
  public void setAllocationIdentifier(int id);
  public void initialize();
}


final class ObjectPool<T extends Poolable>
{
  final int poolSize;
  final ArrayList<T> pool;
  int index = 0;
  final ArrayList<T> temporalInstanceList;
  int temporalInstanceCount = 0;
  int allocationCount = 0;

  ObjectPool(int pSize) {
    poolSize = pSize;
    pool = new ArrayList<T>(pSize);
    temporalInstanceList = new ArrayList<T>(pSize);
  }

  ObjectPool() {
    this(256);
  }

  T allocate() {
    if (isAllocatable() == false) {
      println("Object pool allocation failed. Too many objects created!");
      // Need exception handling
      return null;
    }
    T allocatedInstance = pool.get(index);

    allocatedInstance.setAllocated(true);
    allocatedInstance.setAllocationIdentifier(allocationCount);
    index++;
    allocationCount++;

    return allocatedInstance;
  }

  T allocateTemporal() {
    T allocatedInstance = allocate();
    setTemporal(allocatedInstance);
    return allocatedInstance;
  }

  void storeObject(T obj) {
    if (pool.size() >= poolSize) {
      println("Failed to store a new instance to object pool. Object pool is already full.");
      // Need exception handling
    }
    pool.add(obj);
    obj.setBelongingPool(this);
    obj.setAllocationIdentifier(-1);
    obj.setAllocated(false);
  }

  boolean isAllocatable() {
    return index < poolSize;
  }

  void deallocate(T killedObject) {
    if (!killedObject.isAllocated()) {
      return;
    }

    killedObject.initialize();
    killedObject.setAllocated(false);
    killedObject.setAllocationIdentifier(-1);
    index--;
    pool.set(index, killedObject);
  }

  void update() {
    while(temporalInstanceCount > 0) {
      temporalInstanceCount--;
      deallocate(temporalInstanceList.get(temporalInstanceCount));
    }
    temporalInstanceList.clear();    // not needed when array
  }

  void setTemporal(T obj) {
    temporalInstanceList.add(obj);    // set when array
    temporalInstanceCount++;
  }
}
*/
