// describeElement
// 気が向いたら続きやるわ
// 一日1つでいいと思う
function setup(){
  createCanvas(100, 100);
  background(128, 255, 128);
  describe("こちらはdescribeElementで追加されます", LABEL);
  describeElement("name0", "string0", LABEL);
  describeElement("name1", "string1", LABEL);
  describeElement("name2", "string2", FALLBACK);
  describeElement("name3", "string3", FALLBACK);
  describeElement("name4", "string4", LABEL);
}
